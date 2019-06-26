import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthService } from 'server/api/auth/auth.service';
import { isNone } from 'shared/fun';

@Injectable()
export class SocketGuard implements CanActivate {

  constructor(private readonly authService: AuthService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const socket: Socket = context.getArgByIndex(0)
    const { authentication } = socket.handshake.headers

    if (!authentication || typeof authentication !== 'string') {
      return false
    }

    const [ type, token ] = authentication.split(' ')

    if (type !== 'Bearer') {
      return false
    }

    if (!token) {
      return false
    }

    const session = await this.authService.validate(token)

    if (isNone(session)) {
      return false
    }

    return true
  }
}
