import { Injectable } from '@nestjs/common';
import { PointsHistoryStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { EAuthenticationProviders } from 'src/common/enums/AuthenticationProviders';
import { ErrorCodes } from 'src/common/enums/ErrorCodes';
import { NotFoundError } from 'src/common/exceptions';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async addPoints(userId: string, points: number) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundError(ErrorCodes.USER_NOT_FOUND);
    }

    const updatedPoints = user.points + points;

    return this.prisma.user.update({
      where: { id: userId },
      data: { points: updatedPoints },
    });
  }

  public findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        UserAuthorizationProvider: {
          some: {
            email: {
              mode: 'insensitive',
              equals: email,
            },
          },
        },
      },
    });
  }

  public findUserByProvider(provider: EAuthenticationProviders, email: string) {
    return this.prisma.user.findFirst({
      where: {
        UserAuthorizationProvider: {
          some: {
            AuthorizationProvider: {
              name: {
                mode: 'insensitive',
                equals: provider,
              },
            },
            email,
          },
        },
      },
      include: {
        UserAuthorizationProvider: true,
      },
    });
  }

  public findUserByLogin(login: string) {
    return this.prisma.user.findFirst({
      where: { UserProfile: { login } },
    });
  }

  public findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserProfile: true,
        UserAuthorizationProvider: true,
        PointsHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        Ticket: true,
      },
    });
  }

  public addAdmin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        UserRole: {
          set: [UserRole.USER, UserRole.ADMIN],
        },
      },
    });
  }

  public findRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        UserRole: true,
      },
    });
  }

  public updateUser(
    userId: string,
    { displayName, login, avatar }: { displayName: string; login: string; avatar: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        UserProfile: {
          update: { displayName, login, avatar },
        },
      },
    });
  }

  public createUser(
    provider: EAuthenticationProviders,
    email: string,
    displayName: string,
    login: string,
    avatar: string,
  ) {
    return this.prisma.user.create({
      data: {
        UserAuthorizationProvider: {
          create: {
            AuthorizationProvider: {
              connect: {
                name: provider,
              },
            },
            email,
          },
        },
        UserProfile: {
          create: {
            displayName,
            login,
            avatar,
          },
        },
        UserRole: [UserRole.USER],
      },
      include: {
        UserAuthorizationProvider: true,
      },
    });
  }

  public createPointsHistory(
    userId: string,
    points: number,
    status: PointsHistoryStatus,
    title: string,
    description: string,
  ) {
    return this.prisma.pointsHistory.create({
      data: {
        userId,
        points,
        status,
        title,
        description,
      },
    });
  }
}
