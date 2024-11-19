import { Logger, Module } from '@nestjs/common';
import { loggingMiddleware, PrismaModule } from 'nestjs-prisma';
import { HealthCheckModule } from './health-check/health-check.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TwitchBotModule } from './twitch-bot/twitch-bot.module';
import { SocketJwtStrategy } from './common/strategy/socket-jwt-auth.strategy';
import { ItemModule } from './item/item.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env', '.env.development.local'],
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => ({
        middlewares: [
          loggingMiddleware({
            logger: new Logger('PrismaMiddleware'),
            logLevel: 'log',
          }),
        ],
      }),
    }),
    HealthCheckModule,
    AuthModule,
    UsersModule,
    TwitchBotModule,
    ItemModule,
    WebsocketModule

  ],
  providers: [
    SocketJwtStrategy
  ],
})
export class AppModule {}
