import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { ClipperStatus } from '@prisma/client';

@Injectable()
export class ClipperService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTrending() {
    return this.prismaService.clipper.findMany({
      where: { status: ClipperStatus.Approved },
      orderBy: {
        ClipperLinks: {
          _count: 'desc',
        },
      },
      include: {
        ClipperLinks: true,
        user: {
          select: {
            UserProfile: {
              select: {
                avatar: true,
                displayName: true,
              },
            },
            points: true,
          },
        },
      },
    });
  }

  async getMe(userId: string) {
    return this.prismaService.clipper.findMany({
      where: { userId },
      include: {
        ClipperLinks: true,
      },
    });
  }

  async joinWaitlist(userId: string, body: JoinWaitlistDto) {
    const { clipUrls, twitchUsername, tiktokUsername, motivation } = body;
    const clipper = await this.prismaService.clipper.findFirst({
      where: { userId },
    });

    if (clipper) {
      if (clipper.status === ClipperStatus.Pending) {
        throw new BadRequestException('Você já está na lista de espera');
      }

      if (clipper.status === ClipperStatus.Rejected) {
        return this.prismaService.clipper.update({
          where: { id: clipper.id },
          data: {
            status: ClipperStatus.Pending,
            ...body,
          },
        });
      }
    }

    return this.prismaService.clipper.create({
      data: {
        userId,
        status: ClipperStatus.Pending,
        twitchUsername,
        tiktokUsername,
        motivation,
        ClipperLinks: {
          createMany: {
            data: clipUrls.map(url => ({ url })),
          },
        },
      },
      include: {
        ClipperLinks: true,
      },
    });
  }
}
