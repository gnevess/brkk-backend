import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TwitchBotService } from './twitch-bot.service';
import { PointsProcessor } from './processors/points.processor';
import { UsersModule } from '../users/users.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { TwitchBotController } from './twitch-bot.controller';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RABBITMQ_URI ?? '',
      exchanges: [
        {
          name: 'twitch',
          type: 'topic',
        },
        {
          name: 'points',
          type: 'topic',
        },
      ],
      connectionInitOptions: {
        wait: false,
      },
    }),
    UsersModule,
    WebsocketModule,
  ],
  providers: [TwitchBotService, PointsProcessor],
  exports: [TwitchBotService],
  controllers: [TwitchBotController],
})
export class TwitchBotModule {}
