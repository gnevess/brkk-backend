import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TwitchAuthDTO } from './dto/twitch-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('twitch')
  handleTwitchAuth(@Body() data: TwitchAuthDTO) {
    return this.authService.validateOrCreateUser(data);
  }
}
