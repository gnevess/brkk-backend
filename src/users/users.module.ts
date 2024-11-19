import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { WebsocketModule } from '../websocket/websocket.module';
import { UsersController } from './users.controller';

@Module({
  imports: [forwardRef(() => WebsocketModule)],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
