import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { AuthLoginDTO } from './dto/auth-login.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface/jwt.payload.interface';
import { ConfigType } from '@nestjs/config';
import authConfig from 'src/common/config/auth.config';
import { User } from '@prisma/client';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  public async login(data: AuthLoginDTO) {
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
