import { SubscribeMessage, WebSocketGateway, OnGatewayConnection, WsException, WsResponse } from '@nestjs/websockets';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { SocketGuard } from './socket.guard';
import { Socket } from 'socket.io';
import { AuthService } from 'server/api/auth/auth.service';
import { sessionTokenFromSocket } from './signaling.helper';
import { isNone } from 'shared/fun';
import { isUser } from 'server/api/auth/auth.helpers';
import { ClientService } from 'server/api/client/client.service';

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
  async handleDescriptor(socket: Socket, payload: string): Promise<WsResponse<string>> {
    const token = sessionTokenFromSocket(socket)
    if (isNone(token)) {
      throw new WsException('Unauthorized')
    }
    const consumer = await this.authService.validate(token.v)
    if (isNone(consumer)) {
      throw new WsException('Unauthorized')
    }
    if (isUser(consumer.v)) {
      throw new WsException('Forbidden')
    }

    const client = { ...consumer.v.v, descriptor: payload }

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
