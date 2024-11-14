import { Injectable } from '@nestjs/common';
import { EAuthenticationProviders } from '../common/enums/AuthenticationProviders';
import { PrismaService } from 'nestjs-prisma';
import { AuthorizationProvider } from '@prisma/client';

@Injectable()
export class AuthProviderRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async findAuthorizationProvider(provider: EAuthenticationProviders): Promise<AuthorizationProvider | null> {
    return await this.prismaService.authorizationProvider.findFirst({
      where: {
        name: {
          equals: provider,
          mode: 'insensitive',
        }
      },
    });
  }
}
