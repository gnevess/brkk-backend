import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ClipperService } from './clipper.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated.request.interface';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@Controller('clipper')
export class ClipperController {
  constructor(private readonly clipperService: ClipperService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.clipperService.getMe(req.user.id);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  joinWaitlist(@Req() req: AuthenticatedRequest, @Body() body: JoinWaitlistDto) {
    return this.clipperService.joinWaitlist(req.user.id, body);
  }

  @Get('trending')
  getTrending() {
    return this.clipperService.getTrending();
  }
}
