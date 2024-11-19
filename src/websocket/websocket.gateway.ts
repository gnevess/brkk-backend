import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import {
  WebSocketGateway as NestWebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { JwtSocketGuard } from 'src/common/guards/socket-jwt-auth.guard';
import { Item, Transaction } from '@prisma/client';

@UseGuards(JwtSocketGuard)
@NestWebSocketGateway(3002, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket> = new Map<string, Socket>();

  constructor(private readonly usersService: UsersService) {}

  handleConnection(client: Socket) {
    if (client.id) {
      console.log(`Client connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Remove disconnected client from userSockets
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('auth')
  async handleAuth(client: Socket, payload: { userId: string }) {
    const user = await this.usersService.findById(payload.userId);
    if (!user) {
      client.disconnect();
      return;
    }

    this.userSockets.set(user.id, client);
    console.log(`User ${user.id} authenticated`);
    const userSocket = this.userSockets.get(user.id);
    if (userSocket) {
      userSocket.emit('auth_success', { message: 'Autenticação bem sucedida' });
    }
  }

  public sendPointsUpdate(userId: string, points: number) {
    const userSocket = this.userSockets.get(userId);
    if (userSocket) {
      userSocket.emit('points_update', { type: 'points_update', points });
    }
  }

  public sendTransactionUpdate(transaction: Transaction) {
    this.server.emit('transaction_update', {
      type: 'transaction_update',
      transaction,
    });
  }

  public sendItemUpdate(items: Item[]) {
    console.log(items);
    this.server.emit('item_update', {
      type: 'item_update',
      items
    });
  }
}
