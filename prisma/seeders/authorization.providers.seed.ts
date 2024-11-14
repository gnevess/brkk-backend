import { Logger } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { AuthorizationProvider, PrismaClient } from '@prisma/client';
import { EAuthenticationProviders } from '../../src/common/enums/AuthenticationProviders';

const prismaClient = new PrismaClient();
const logger = new Logger('PrismaSeeder');
async function createAuthorizationProvidersSeed(): Promise<void> {
  await prismaClient.$connect();
  try {
    await prismaClient.userAuthorizationProvider.deleteMany();
    await prismaClient.userProfile.deleteMany();
    await prismaClient.user.deleteMany();
    await prismaClient.authorizationProvider.deleteMany();

    const authorizationProviders: AuthorizationProvider[] = [
      {
        id: uuidv7(),
        clientId: null,
        associationClaimType: 'email',
        createdAt: new Date(),
        deletedAt: null,
        updatedAt: new Date(),
        name: EAuthenticationProviders.TWITCH,
        secret: null,
        tokenUrl: null,
      },
    ];

    await prismaClient.authorizationProvider.createMany({
      data: authorizationProviders,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`error to create users ${error.message}`);
    }

    logger.error(`error to create users ${error}`);
  }
  await prismaClient.$disconnect();
}
export default createAuthorizationProvidersSeed;
