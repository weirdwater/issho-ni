import { OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, OnGatewayDisconnect } from '@nestjs/websockets';
import { DescriptorDTO } from 'shared/dto/signaling/descriptor.dto';
import { Server, Socket } from 'socket.io';
import { isNone } from '../../shared/fun';
import { isUser } from '../api/auth/auth.helpers';
import { AuthService } from '../api/auth/auth.service';
import { ClientService } from '../api/client/client.service';
import { AuthSocket, sessionTokenFromSocket } from './signaling.helper';

@WebSocketGateway()
export class SignalingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly clientService: ClientService,
  ) {}

  async handleConnection(socket: Socket) {
    const { session } = socket.handshake.query
    const token = sessionTokenFromSocket(socket)

    if (isNone(token)) {
      socket.emit('exception', 'Forbidden: No authentication provided')
      return socket.disconnect()
    }

    const consumer = await this.authService.validate(token.v)

    if (isNone(consumer)) {
      socket.emit('exception', 'Forbidden')
      return socket.disconnect()
    }

    (socket as AuthSocket).consumer = consumer.v

    if (session) {
      const room = `${session}_${ isUser(consumer.v) ? 'user' : consumer.v.v.kind }`
      socket.join(room)
    }
  }

  @SubscribeMessage('events')
  handleMessage(socket: Socket, payload: any): string {
    return payload;
  }

  // descriptor
  // will set/update the client's descriptor
  @SubscribeMessage('descriptor')
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
  async handleCandidate(socket: AuthSocket, candidate: any) {
    // console.log(candidate)
  }

  // presenterDescriptor
  // will return the presenter's descriptor

  // sourceDescriptors
  // will return the session's source client descriptors

}
