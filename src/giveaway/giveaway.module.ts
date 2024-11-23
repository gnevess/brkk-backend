import { Module } from '@nestjs/common';
import { GiveawayService } from './giveaway.service';
import { UsersModule } from '../users/users.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { GiveawayController } from './giveaway.controller';

@Module({
  imports: [
    UsersModule,
    WebsocketModule,
  ],
  controllers: [GiveawayController],
  providers: [GiveawayService],
  exports: [GiveawayService],
})
export class GiveawayModule {}
