import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class JwtSocketGuard extends AuthGuard('jwt-socket') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token: string | string[] = client.handshake.auth.token ?? '';

    //Extract the token from query
    if (token === undefined) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const authtoken: string = Array.isArray(token) ? token[0] : token;
    client.data.token = authtoken; // Set the token on the Socket object

    return super.canActivate(context);
  }
}
