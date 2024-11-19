import { Module } from '@nestjs/common';
import { TwitchBotService } from './twitch-bot.service';
import { UsersModule } from '../users/users.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { TwitchBotController } from './twitch-bot.controller';

@Module({
  imports: [UsersModule, WebsocketModule],
  providers: [TwitchBotService],
  exports: [TwitchBotService],
  controllers: [TwitchBotController],
})
export class TwitchBotModule {}
