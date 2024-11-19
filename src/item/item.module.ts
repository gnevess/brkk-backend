import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [WebsocketModule, UsersModule],
  controllers: [ItemController],
  providers: [ItemService],
})
export class ItemModule {}
