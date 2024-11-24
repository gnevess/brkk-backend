import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { UserPointsData } from '../interfaces/user-points.interface';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BadgeUpdateData } from '../interfaces/badge-update-data.interface';

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
    const { username, points } = data;

    try {
      const user = await this.usersService.findByLogin(username);

      if (user) {
        const res = await this.usersService.addPoints(user.id, points);

        this.wsGateway.sendPointsUpdate(user.id, res.points);
      }
    } catch (error) {
      console.error(`Error processing points for ${username}:`, error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'twitch',
    routingKey: 'badge-update',
    queue: 'badge-update-queue',
  })
  async handleBadgeUpdate(data: BadgeUpdateData) {
    const { username, badges } = data;

    const badgeStatus = {
      moderator: !!badges.moderator,
      subscriber: !!badges.subscriber,
      subGifter: !!badges['sub-gifter'],
      subTime: badges.subscriber ? parseInt(badges.subscriber) : 0,
      subGifterCount: badges['sub-gifter'] ? parseInt(badges['sub-gifter']) : 0,
      premium: !!badges.premium,
      vip: data.vip,
      turbo: data.turbo,
      color: data.color,
    };

    const user = await this.usersService.findByLogin(username);

    if (user) {
      await this.usersService.updateBadges(user.id, badgeStatus);
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
