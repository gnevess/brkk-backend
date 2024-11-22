import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'tmi.js';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { StreamStatus } from './interfaces/user-points.interface';
@Injectable()
export class TwitchBotService implements OnModuleInit {
  private client: Client;
  private activeUsers: Set<string> = new Set<string>();
  private readonly POINTS_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly STREAM_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
  private streamStatus: StreamStatus = {
    isOnline: false,
    lastCheck: new Date(),
  };

  constructor(private readonly amqpConnection: AmqpConnection) {
    this.client = new Client({
      options: { debug: false },
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
    await this.connect();
    this.registerEventHandlers();
    this.startPointsTimer();
    this.startStreamStatusChecker();
  }

  private registerEventHandlers() {
    this.client.on('chat', (channel, userstate, message, self) => {
      if (self) return;

      const points = 0.1;
      void this.amqpConnection.publish('points', 'award-points', {
        username: userstate.username ?? '',
        displayName: userstate['display-name'] ?? '',
        points,
        reason: 'chat',
      });
    });

    this.client.on('join', (channel, username, self) => {
      if (self) return;

      const points = 5;
      this.activeUsers.add(username);
      void this.amqpConnection.publish('points', 'award-points', {
        username,
        displayName: username,
        points,
        reason: 'join',
      });
    });
  }

  private startPointsTimer() {
    setInterval(() => {
      const points = this.streamStatus.isOnline ? 10 : 3;

      this.activeUsers.forEach(username => {
        void this.amqpConnection.publish('points', 'award-points', {
          username,
          displayName: username,
          points,
          reason: 'timer',
        });
      });

      this.activeUsers.clear();
    }, this.POINTS_INTERVAL);
  }

  private startStreamStatusChecker() {
    setInterval(() => {
      void (async () => {
        this.streamStatus = {
          isOnline: await this.isStreamOnline(),
          lastCheck: new Date(),
        };
      })();
    }, this.STREAM_CHECK_INTERVAL);
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('Connected to Twitch IRC');
    } catch (error) {
      console.error('Failed to connect to Twitch IRC:', error);
    }
  }

  private async getTwitchOAuthToken(): Promise<string> {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.TWITCH_CLIENT_ID ?? '',
          client_secret: process.env.TWITCH_CLIENT_SECRET ?? '',
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status.toString()}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Failed to get Twitch OAuth token:', error);
      throw error;
    }
  }

  async getVods() {
    try {
      const accessToken = await this.getTwitchOAuthToken();
      const response = await fetch(
        'https://api.twitch.tv/helix/videos?user_id=' + (process.env.TWITCH_CHANNEL_ID ?? '') + '&first=30',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID ?? '',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status.toString()}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch VODs:', error);
      return [];
    }
  }

  private async isStreamOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000); // 5s timeout

      const response = await fetch(
        `https://api.twitch.tv/helix/streams?user_login=${process.env.TWITCH_CHANNEL ?? ''}`,
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${await this.getTwitchOAuthToken()}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID ?? '',
          },
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status.toString()}`);
      }

      const data = await response.json();
      return data.data.length > 0;
    } catch (error) {
      console.error('Failed to check stream status:', error);
      return false;
    }
  }
}
