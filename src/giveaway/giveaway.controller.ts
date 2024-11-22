import { Controller, Post, Body, Param, UseGuards, Req, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { GiveawayService } from './giveaway.service';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/authenticated.request.interface';
import { ParticipateGiveawayDto } from './dto/participate-giveaway.dto';

@Controller('giveaway')
export class GiveawayController {
  constructor(private readonly giveawayService: GiveawayService) {}

  @Get()
  getGiveaways() {
    return this.giveawayService.getGiveaways();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createGiveaway(@Body() dto: CreateGiveawayDto) {
    return this.giveawayService.createGiveaway(dto);
  }

  @Get(':id')
  getGiveaway(@Param('id') id: string) {
    return this.giveawayService.getGiveaway(id);
  }

  @Post(':id/participate')
  @UseGuards(JwtAuthGuard)
  participateGiveaway(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() data: ParticipateGiveawayDto) {
    return this.giveawayService.participateGiveaway(req.user.id, id, data);
  }

  @Get(`tickets`)
  @UseGuards(JwtAuthGuard)
  getUserTickets(@Req() req: AuthenticatedRequest) {
    return this.giveawayService.getUserTickets(req.user.id);
  }

  @Post(':id/draw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  drawWinners(@Param('id') id: string) {
    return this.giveawayService.drawWinners(id);
  }

  @Get(':id/odds')
  getGiveawayOdds(@Param('id') id: string) {
    return this.giveawayService.getGiveawayOdds(id);
  }

  @Get(':id/tickets')
  async getGiveawayTicketsHash(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.giveawayService.getGiveawayTicketsHash(id, page, limit);
  }
}
