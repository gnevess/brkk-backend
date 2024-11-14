import { Injectable } from '@nestjs/common';
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

  public createUser(provider: EAuthenticationProviders, email: string) {
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
      },
      include: {
        UserAuthorizationProvider: true,
      },
    });
  }

  public updateName(userId: string, firstName: string, lastName: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        UserProfile: {
          upsert: {
            where: {
              userId,
            },
            update: {
              firstName,
              lastName,
            },
            create: {
              firstName,
              lastName,
            },
          },
        },
      },
    });
  }
}
