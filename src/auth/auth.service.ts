import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface/jwt.payload.interface';
import { ConfigType } from '@nestjs/config';
import authConfig from 'src/common/config/auth.config';
import { User } from '@prisma/client';
import { TwitchAuthDTO } from './dto/twitch-auth.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  public async validateOrCreateUser(data: TwitchAuthDTO) {
    const user = await this.userService.validateUser(data);

    return this.createToken(user.id);
  }

  private createToken(sub: string) {
    const user: JwtPayload = { sub };

    const accessToken = this.jwtService.sign(user);

    return {
      expireTime: this.authConfiguration.JWT_EXPIRES_TIME,
      accessToken,
    };
  }

  public async validateUser(payload: JwtPayload): Promise<User | null> {
    return await this.userService.findById(payload.sub);
  }
}
