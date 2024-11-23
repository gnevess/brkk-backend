import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { createHash } from 'crypto';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { GiveawayStatus, PointsHistoryStatus } from '@prisma/client';
import { bucketUpload } from 'src/common/bucket/bucket-upload';
import { Readable } from 'stream';
import { getPresignedUrlForDownload } from 'src/common/bucket/presigned-urls';
import { ParticipateGiveawayDto } from './dto/participate-giveaway.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GiveawayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WebSocketGateway,
    private readonly userService: UsersService,
  ) {}

  async getGiveaway(id: string) {
    const giveaway = await this.prisma.giveaway.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
        tickets: {
          distinct: ['userId'],
          select: {
            user: {
              select: {
                UserProfile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        winners: {
          select: {
            id: true,
            UserProfile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!giveaway) return null;

    return {
      ...giveaway,
      image: getPresignedUrlForDownload(giveaway.image ?? ''),
      totalTickets: giveaway._count.tickets,
      participants: giveaway.tickets.length,
      winners: giveaway.winners,
    };
  }

  async getGiveawayTicketsHash(id: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { giveawayId: id },
        include: {
          user: {
            select: {
              UserProfile: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({
        where: { giveawayId: id },
      }),
    ]);

    return {
      tickets: tickets.map(item => ({
        hash: item.hash,
        user: item.user.UserProfile,
        createdAt: item.createdAt,
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }

  async getUserTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
    });
  }

  async getGiveaways() {
    const res = await this.prisma.giveaway.findMany({
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
        tickets: {
          distinct: ['userId'],
          select: {
            user: {
              select: {
                UserProfile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        winners: {
          select: {
            id: true,
            UserProfile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return res.map(giveaway => ({
      ...giveaway,
      image: getPresignedUrlForDownload(giveaway.image ?? ''),
      totalTickets: giveaway._count.tickets,
      participants: giveaway.tickets.length,
      uniqueParticipants: giveaway.tickets.map(ticket => ticket.user.UserProfile),
      winners: giveaway.winners,
    }));
  }

  async createGiveaway(dto: CreateGiveawayDto) {
    const { image, ...rest } = dto;

    // Convert base64 to Multer File object
    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const multerFile: Express.Multer.File = {
      buffer,
      fieldname: 'file',
      originalname: `image-${Date.now().toString()}.png`,
      encoding: '7bit',
      mimetype: 'image/png',
      size: buffer.length,
      stream: Readable.from(buffer),
      destination: '',
      filename: '',
      path: '',
    };

    const { key } = await bucketUpload(multerFile);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.prisma.giveaway.create({
      data: {
        ...rest,
        startDate,
        endDate,
        image: key,
      },
    });
  }

  async participateGiveaway(userId: string, giveawayId: string, data: ParticipateGiveawayDto) {
    const giveaway = await this.prisma.giveaway.findUnique({
      where: { id: giveawayId },
      include: { tickets: true },
    });

    if (!giveaway) {
      throw new BadRequestException('Giveaway not found');
    }

    if (giveaway.status !== GiveawayStatus.Active) {
      throw new BadRequestException('Giveaway is not active');
    }

    if (new Date() < giveaway.startDate || new Date() > giveaway.endDate) {
      throw new BadRequestException('Giveaway is not currently running');
    }

    // Check if user already has tickets and validate against max tickets
    const existingTicketCount = await this.prisma.ticket.count({
      where: {
        userId,
        giveawayId,
      },
    });

    const totalTickets = existingTicketCount + data.tickets;

    if (totalTickets > (giveaway.maxTickets ?? -1) && giveaway.maxTickets !== -1) {
      throw new BadRequestException('Exceeds maximum allowed tickets for this giveaway');
    }

    // Check user points
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const requiredPoints = data.tickets * giveaway.ticketPrice;
    if (user.points < requiredPoints) {
      throw new BadRequestException('Insufficient points');
    }

    // Deduct points from user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          decrement: Number(requiredPoints),
        },
      },
    });

    // Generate tickets in bulk
    const ticketsData = Array.from({ length: data.tickets }, () => ({
      hash: this.generateTicketHash(userId, giveawayId),
      userId,
      giveawayId,
    }));

    // Create all tickets in a single database operation
    const tickets = await this.prisma.ticket.createMany({
      data: ticketsData,
    });

    // Fetch the created tickets with user data for websocket
    const ticketsWithUserData = await this.prisma.ticket.findMany({
      where: {
        userId,
        giveawayId,
        createdAt: {
          gte: new Date(Date.now() - 1000),
        },
      },
      include: {
        user: {
          select: {
            UserProfile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    await this.userService.createPointsHistory(
      userId,
      requiredPoints,
      PointsHistoryStatus.Redeemed,
      'Participação em sorteio',
      `Você comprou ${data.tickets.toString()} tickets para o sorteio ${giveaway.title} por ${requiredPoints.toFixed(2)} pontos!`,
    );

    this.wsGateway.sendGiveawayUpdate(ticketsWithUserData);

    this.wsGateway.sendPointsUpdate(userId, user.points - requiredPoints);

    return tickets;
  }

  async drawWinners(giveawayId: string) {
    const giveaway = await this.prisma.giveaway.findUnique({
      where: { id: giveawayId },
      include: { tickets: true },
    });

    if (!giveaway) {
      throw new BadRequestException('Giveaway not found');
    }

    if (giveaway.status !== GiveawayStatus.Active) {
      throw new BadRequestException('Giveaway is already completed');
    }

    if (giveaway.tickets.length < giveaway.winnerCount) {
      throw new BadRequestException('Not enough participants');
    }

    // Randomly select winners
    const shuffled = [...giveaway.tickets].sort(() => 0.5 - Math.random());
    const winnerTickets = shuffled.slice(0, giveaway.winnerCount);

    // Update giveaway status and set winners
    const updatedGiveaway = await this.prisma.giveaway.update({
      where: { id: giveawayId },
      data: {
        status: GiveawayStatus.Completed,
        winners: {
          connect: winnerTickets.map(ticket => ({ id: ticket.userId })),
        },
      },
      include: {
        winners: {
          select: {
            id: true,
            UserProfile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    this.wsGateway.sendGiveawayComplete(giveawayId, updatedGiveaway);

    return updatedGiveaway;
  }

  private generateTicketHash(userId: string, giveawayId: string): string {
    const hash = createHash('sha256');
    const random = Math.random().toString(36).substring(2, 15);
    hash.update(`${userId}-${giveawayId}-${random}`);
    return hash.digest('hex');
  }

  async getGiveawayOdds(giveawayId: string) {
    const giveaway = await this.prisma.giveaway.findUnique({
      where: { id: giveawayId },
      include: {
        tickets: {
          include: {
            user: {
              select: {
                id: true,
                UserProfile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!giveaway) {
      throw new BadRequestException('Giveaway not found');
    }

    // Group tickets by user
    const userTickets = giveaway.tickets.reduce<
      Record<string, { user: { id: string; profile: any }; ticketCount: number }>
    >((acc, ticket) => {
      const userId = ticket.user.id;
      if (!(userId in acc)) {
        acc[userId] = {
          user: {
            id: userId,
            profile: ticket.user.UserProfile,
          },
          ticketCount: 0,
        };
      }
      acc[userId].ticketCount++;
      return acc;
    }, {});

    // Calculate odds for each user
    const totalTickets = giveaway._count.tickets;
    const userOdds = Object.values(userTickets).map(({ user, ticketCount }) => ({
      user: {
        id: user.id,
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
      },
      ticketCount,
      odds: (ticketCount / totalTickets) * 100,
    }));

    // Sort by odds (highest to lowest)
    return userOdds.sort((a, b) => b.odds - a.odds);
  }
}
