import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'tmi.js';
import { UsersService } from '../users/users.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { PointsHistoryStatus } from '@prisma/client';

@Injectable()
export class TwitchBotService implements OnModuleInit {
  private client: Client;
  private activeUsers: Set<string> = new Set<string>();
  private readonly POINTS_INTERVAL = 5 * 60 * 1000;

  constructor(
    private readonly usersService: UsersService,
    private readonly wsGateway: WebSocketGateway,
  ) {
    this.client = new Client({
      options: { debug: true },
      connection: {
        secure: true,
        reconnect: true,
      },
      identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_BOT_TOKEN,
      },
      channels: [process.env.TWITCH_CHANNEL ?? ''],
    });
  }

  async onModuleInit() {
    console.log('Initializing Twitch bot');
    await this.connect();
    this.registerEventHandlers();
    this.startPointsTimer();
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('Connected to Twitch IRC');
    } catch (error) {
      console.error('Failed to connect to Twitch IRC:', error);
    }
  }

  private registerEventHandlers() {
    this.client.on('chat', (channel, userstate, message, self) => {
      if (self) return;

      const points = 1;
      this.activeUsers.add(userstate.username ?? '');
      this.handleUserActivity(userstate.username ?? '', userstate['display-name'] ?? '', points).catch(
        (err: unknown) => {
          console.error('Error handling chat activity:', err);
        },
      );
    });

    this.client.on('join', (channel, username, self) => {
      if (self) return;

      const points = 5;
      this.handleUserActivity(username, username, points).catch((err: unknown) => {
        console.error('Error handling join activity:', err);
      });
    });
  }

  private async handleUserActivity(username: string, displayName: string, points: number) {
    try {
      const user = await this.usersService.findByLogin(username);

      if (user) {
        const res = await this.usersService.addPoints(user.id, points);
        await this.usersService.createPointsHistory(
          user.id,
          points,
          PointsHistoryStatus.Received,
          'Twitch',
          `Você ganhou ${points.toString()} pontos pela atividade no chat!`,
        );
        console.log(`User ${username} ${displayName} has ${res.points.toFixed(2)} points`);

        this.wsGateway.sendPointsUpdate(user.id, res.points);
      }
    } catch (error) {
      console.error(`Error handling user activity for ${username}:`, error);
    }
  }

  private startPointsTimer() {
    setInterval(() => {
      void (async () => {
        const isOnline = await this.isStreamOnline();
        const points = isOnline ? 10 : 3;

        this.activeUsers.forEach(username => {
          this.handleUserActivity(username, username, points).catch((err: unknown) => {
            console.error('Error handling timer points:', err);
          });
        });
        this.activeUsers.clear();
      })();
    }, this.POINTS_INTERVAL);
  }

  private async isStreamOnline(): Promise<boolean> {
    try {
      const response = await fetch(`https://twitch.tv/${process.env.TWITCH_CHANNEL ?? ''}`);
      const sourceCode = await response.text();

      if (sourceCode.includes('isLiveBroadcast')) {
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error occurred:', error);
      return false;
    }
  }
}
