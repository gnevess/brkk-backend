import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TwitchBotService } from './twitch-bot.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('twitch')
export class TwitchBotController {
  constructor(private readonly twitchBotService: TwitchBotService) {}

  @Get('vods')
  getVods() {
    return this.twitchBotService.getVods();
  }

  @Get('clip/:id')
  @ApiOperation({ summary: 'Get a clip by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the clip' })
  @UseGuards(JwtAuthGuard)
  getClip(@Param('id') id: string) {
    return this.twitchBotService.getClip(id);
  }
}
