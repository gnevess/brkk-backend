import { Module } from '@nestjs/common';
import { TwitchBotService } from './twitch-bot.service';
import { UsersModule } from '../users/users.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [UsersModule, WebsocketModule],
  providers: [TwitchBotService],
  exports: [TwitchBotService],
})
export class TwitchBotModule {}
