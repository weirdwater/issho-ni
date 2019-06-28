import { SubscribeMessage, WebSocketGateway, WsException, WsResponse } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { SocketGuard } from './socket.guard';
import { Socket } from 'socket.io';
import { AuthService } from '../api/auth/auth.service';
import { sessionTokenFromSocket, AuthSocket } from './signaling.helper';
import { isNone, Maybe } from '../../shared/fun';
import { isUser, Consumer } from '../api/auth/auth.helpers';
import { ClientService } from '../api/client/client.service';

@WebSocketGateway()
export class SignalingGateway {

  constructor(
    private readonly authService: AuthService,
    private readonly clientService: ClientService,
  ) {}

  @SubscribeMessage('events')
  @UseGuards(SocketGuard)
  handleMessage(socket: Socket, payload: any): string {
    return payload;
  }

  // descriptor
  // will set/update the client's descriptor
  @SubscribeMessage('descriptor')
  @UseGuards(SocketGuard)
  async handleDescriptor(socket: AuthSocket, payload: string): Promise<WsResponse<string>> {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }

    const client = { ...socket.consumer.v, descriptor: payload }

    try {
      await this.clientService.save(client)
      // TODO: Send updated descriptor to relevant peers
      return { event: 'descriptor', data: 'set' }
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e)
      throw new WsException('Something went wrong saving the descriptor')
    }

  }

  // presenterDescriptor
  // will return the presenter's descriptor

  // sourceDescriptors
  // will return the session's source client descriptors

}
