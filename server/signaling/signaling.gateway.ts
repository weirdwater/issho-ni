import { SubscribeMessage, WebSocketGateway, WsException, WsResponse } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { SocketGuard } from './socket.guard';
import { Socket } from 'socket.io';
import { AuthService } from '../api/auth/auth.service';
import { sessionTokenFromSocket, AuthSocket } from './signaling.helper';
import { isNone, Maybe } from '../../shared/fun';
import { isUser, Consumer } from '../api/auth/auth.helpers';
import { ClientService } from '../api/client/client.service';
import { DescriptorDTO } from 'shared/dto/signaling/descriptor.dto';

@WebSocketGateway()
export class SignalingGateway {

  constructor(
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
  async handleDescriptor(socket: AuthSocket, descriptor: DescriptorDTO): Promise<void> {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }

    const client = { ...socket.consumer.v, descriptor: descriptor.sdp }

    try {
      await this.clientService.save(client)
      // TODO: Send updated descriptor to relevant peers
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e)
      throw new WsException('Something went wrong saving the descriptor')
    }

  }

  // TODO: Figure out what to do on candidate
  @SubscribeMessage('candidate')
  @UseGuards(SocketGuard)
  async handleCandidate(socket: AuthSocket, candidate: any) {
    console.log(candidate)
  }

  // presenterDescriptor
  // will return the presenter's descriptor

  // sourceDescriptors
  // will return the session's source client descriptors

}
