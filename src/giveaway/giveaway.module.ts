import { Module } from '@nestjs/common';
import { GiveawayService } from './giveaway.service';
import { UsersModule } from '../users/users.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    UsersModule,
    WebsocketModule,
  ],
  providers: [GiveawayService],
  exports: [GiveawayService],
})
export class GiveawayModule {}
