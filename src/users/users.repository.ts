import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { EAuthenticationProviders } from 'src/common/enums/AuthenticationProviders';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  public findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserProfile: true,
        UserAuthorizationProvider: true,
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

  public updateUser(userId: string, { displayName, login, avatar }: { displayName: string, login: string, avatar: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        UserProfile: {
          update: { displayName, login, avatar },
        },
      },
    });
  }

  public createUser(provider: EAuthenticationProviders, email: string, displayName: string, login: string, avatar: string) {
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
}
