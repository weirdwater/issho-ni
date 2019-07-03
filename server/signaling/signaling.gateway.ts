import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { DescriptorDTO, CandidateDTO, SourceDTO } from '../../shared/dto';
import { Server, Socket } from 'socket.io';
import { isNone } from '../../shared/fun';
import { isClient, isUser } from '../api/auth/auth.helpers';
import { AuthService } from '../api/auth/auth.service';
import { ClientService } from '../api/client/client.service';
import { AuthSocket, makeRoom, roomFromConsumer, sessionTokenFromSocket, presenterRoom } from './signaling.helper';
import { RavenInterceptor } from 'nest-raven';
import { UseInterceptors, UseGuards } from '@nestjs/common';
import { SocketGuard } from './socket.guard';

@WebSocketGateway()
@UseInterceptors(new RavenInterceptor({
  context: 'Ws',
} as any))
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
  @UseGuards(SocketGuard)
  async handleDescriptor(socket: AuthSocket, data: SourceDTO<DescriptorDTO>): Promise<void> {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }
    const { session } = socket.handshake.query
    const room = data.target === 'presenter' ? presenterRoom(session) : (await this.clientService.findOne(data.sourceClientId)).socket
    if (room === undefined) {
      throw new WsException(`No socket found for the client with id ${data.target}`)
    }
    socket.to(room).emit('descriptor', data)
  }

  @SubscribeMessage('candidate')
  @UseGuards(SocketGuard)
  async handleCandidate(socket: AuthSocket, data: SourceDTO<CandidateDTO>): Promise<void> {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }
    const { session } = socket.handshake.query
    const room = data.target === 'presenter' ? presenterRoom(session) : (await this.clientService.findOne(data.sourceClientId)).socket
    if (room === undefined) {
      throw new WsException(`No socket found for the client with id ${data.target}`)
    }
    socket.to(room).emit('candidate', data)
  }

}
