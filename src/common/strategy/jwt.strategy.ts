import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { AuthService } from '../../auth/auth.service';
import { UnauthorizedError } from '../exceptions';
import authConfig from '../config/auth.config';
import { JwtPayload } from 'src/auth/interface/jwt.payload.interface';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    @Inject(authConfig.KEY)
    private authConfiguration: ConfigType<typeof authConfig>,
  ) {
    super({
      ignoreExpiration: true,
      secretOrKey: authConfiguration.JWT_SECRET,
      jwtCookieName: 'access_token',
      jwtFromRequest: (req: Request & { headers: { authorization: string; cookie: string } }) => {
        if (req.headers.authorization) {
          const token = req.headers.authorization.replace('Bearer ', '');
          return token;
        }
        let token: string | null = null;
        if (req.headers.cookie) {
          const tokenExtracted = req.headers.cookie.split(';').find((c: string) => c.trim().startsWith('accessToken='));
          if (tokenExtracted?.split('=')[1]) {
            token = tokenExtracted.split('=')[1];
          }
        }
        return token;
      },
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    console.log(payload);
    const user = await this.authService.validateUser(payload);

    if (!user) throw new UnauthorizedError('Invalid token');

    return user;
  }
}
