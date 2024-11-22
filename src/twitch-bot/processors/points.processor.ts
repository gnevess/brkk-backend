import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { UserPointsData } from '../interfaces/user-points.interface';
import { PointsHistoryStatus } from '@prisma/client';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class PointsProcessor {
  constructor(
    private readonly usersService: UsersService,
    private readonly wsGateway: WebSocketGateway,
  ) {}

  @RabbitSubscribe({
    exchange: 'points',
    routingKey: 'award-points',
    queue: 'points-queue',
  })
  async handlePoints(data: UserPointsData) {
    const { username, points, reason } = data;

    try {
      const user = await this.usersService.findByLogin(username);

      if (user) {
        const res = await this.usersService.addPoints(user.id, points);
        await this.usersService.createPointsHistory(
          user.id,
          points,
          PointsHistoryStatus.Received,
          'Twitch',
          `Você ganhou ${points.toFixed(2)} pontos por ${this.getReasonMessage(reason)}!`,
        );

        this.wsGateway.sendPointsUpdate(user.id, res.points);
      }
    } catch (error) {
      console.error(`Error processing points for ${username}:`, error);
      throw error;
    }
  }

  private getReasonMessage(reason: 'chat' | 'timer' | 'join'): string {
    const messages = {
      chat: 'enviar mensagem no chat',
      timer: 'assistir a live',
      join: 'entrar no chat',
    };
    return messages[reason];
  }
}
