import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { DescriptorDTO, CandidateDTO, SourceDTO } from 'shared/dto';
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
    const room = clientType === 'source' ? makeRoom('presenter')(session) : makeRoom('source')(session)

    const sourceDTO = new SourceDTO<DescriptorDTO>()
    sourceDTO.clientId = socket.consumer.v.id
    sourceDTO.data = descriptor

    const data = clientType === 'source' ? sourceDTO : descriptor

    socket.to(room).emit('descriptor', data)
  }

  @SubscribeMessage('candidate')
  handleCandidate(socket: AuthSocket, candidate: CandidateDTO): void {
    if (isUser(socket.consumer)) {
      throw new WsException('Forbidden')
    }
    const { session } = socket.handshake.query
    const clientType = socket.consumer.v.kind
    const room = clientType === 'source' ? makeRoom('presenter')(session) : makeRoom('source')(session)

    const sourceDTO = new SourceDTO<CandidateDTO>()
    sourceDTO.clientId = socket.consumer.v.id
    sourceDTO.data = candidate

    const data = clientType === 'source' ? sourceDTO : candidate

    socket.to(room).emit('candidate', data)
  }
}
