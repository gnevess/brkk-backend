import { Controller, Get } from '@nestjs/common';
import { TwitchBotService } from './twitch-bot.service';

@Controller('twitch')
export class TwitchBotController {
  constructor(private readonly twitchBotService: TwitchBotService) {}

  @Get('vods')
  getVods() {
    return this.twitchBotService.getVods();
  }
}
