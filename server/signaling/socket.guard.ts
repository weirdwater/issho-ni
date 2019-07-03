import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthService } from '../api/auth/auth.service';
import { isNone } from '../../shared/fun';
import { sessionTokenFromSocket, AuthSocket } from './signaling.helper';

@Injectable()
export class SocketGuard implements CanActivate {

  constructor(private readonly authService: AuthService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const socket: Socket = context.getArgByIndex(0)
    const token = sessionTokenFromSocket(socket)

    if (isNone(token)) {
      return false
    }

    if ((socket as AuthSocket).consumer) {
      return true
    }

    const session = await this.authService.validate(token.v)

    if (isNone(session)) {
      return false
    }

    context.getArgByIndex(0).consumer = session.v

    return true
  }
}
