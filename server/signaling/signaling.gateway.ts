import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { DescriptorDTO } from 'shared/dto/signaling/descriptor.dto';
import { Server, Socket } from 'socket.io';
import { isNone } from '../../shared/fun';
import { isClient, isUser } from '../api/auth/auth.helpers';
import { AuthService } from '../api/auth/auth.service';
import { ClientService } from '../api/client/client.service';
import { AuthSocket, makeRoom, roomFromConsumer, sessionTokenFromSocket } from './signaling.helper';

@WebSocketGateway()
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

    if (isClient(consumer.v)) {
      consumer.v.v.socket = socket.id
      this.clientService.save(consumer.v.v)
    }

    (socket as AuthSocket).consumer = consumer.v

    if (session) {
      const room = roomFromConsumer(consumer.v)(session)
      socket.join(room)
    }
  }

  handleDisconnect(socket: Socket) {
    if ((socket as AuthSocket).consumer) {
      const { consumer } = socket as AuthSocket
      if (isClient(consumer)) {
        consumer.v.socket = null
        this.clientService.save(consumer.v)
      }
    }
  }

  @SubscribeMessage('descriptor')
  handleDescriptor(socket: AuthSocket, descriptor: DescriptorDTO): void {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }
    const { session } = socket.handshake.query
    const clientType = socket.consumer.v.kind

    if (clientType === 'source') {
      const presenterRoom = makeRoom('presenter')(session)
      socket.to(presenterRoom).emit('descriptor', { clientId: socket.consumer.v.id, descriptor })
      return
    }

    if (clientType === 'presenter') {
      const sourceRoom = makeRoom('source')(session)
      socket.to(sourceRoom).emit('descriptor', descriptor)
      return
    }
  }

  @SubscribeMessage('candidate')
  handleCandidate(socket: AuthSocket, candidate: any): void {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }
    const { session } = socket.handshake.query
    const clientType = socket.consumer.v.kind

    if (clientType === 'source') {
      const presenterRoom = makeRoom('presenter')(session)
      socket.to(presenterRoom).emit('candidate', { clientId: socket.consumer.v.id, candidate })
      return
    }

    if (clientType === 'presenter') {
      const sourceRoom = makeRoom('source')(session)
      socket.to(sourceRoom).emit('candidate', candidate)
      return
    }
  }
}
