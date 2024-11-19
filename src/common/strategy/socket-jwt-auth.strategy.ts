import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Socket } from 'socket.io';
import { UnauthorizedError } from '../exceptions';
import { AuthService } from 'src/auth/auth.service';
import { JwtPayload } from 'src/auth/interface/jwt.payload.interface';

@Injectable()
export class SocketJwtStrategy extends PassportStrategy(Strategy, 'jwt-socket') {
  constructor(
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: SocketJwtStrategy.extractJWT,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  private static extractJWT(socket: Socket): string | null {
    if (socket.data.token) {
      return socket.data.token;
    }
    return null;
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload);

    if (!user) throw new UnauthorizedError('Invalid token');

    return user;
  }
}
