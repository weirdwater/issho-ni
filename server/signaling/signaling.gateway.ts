import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets'
import { DescriptorDTO, CandidateDTO, SourceDTO } from '../../shared/dto'
import { Server, Socket } from 'socket.io'
import { isNone } from '../../shared/fun'
import { isClient, isUser } from '../api/auth/auth.helpers'
import { AuthService } from '../api/auth/auth.service'
import { ClientService } from '../api/client/client.service'
import { AuthSocket, roomFromConsumer, sessionTokenFromSocket, presenterRoom, makeRoom } from './signaling.helper'
import { RavenInterceptor } from 'nest-raven'
import { UseInterceptors, UseGuards } from '@nestjs/common'
import { SocketGuard } from './socket.guard'
import { SessionService } from '../api/session/session.service'
import { UserService } from '../api/user/user.service';

const testLyrics: Array<[string, number]> = [
  ['Dit is een lyric test.', 2000],
  ['De lyrics die nu verschijnen...', 2000],
  ['zijn hardcoded in de server.', 2500],
  ['Maar worden wel per socket naar...', 2500],
  ['alle verbonden clients gestuurd.', 2500],
  ['', 0],
]

const emitLyrics = (server: Server, sessionId: string, allLyrics: Array<[string, number]>, onFinish: () => void) => {
  const rec = (lyrics: Array<[string, number]>) => {
    if (lyrics.length < 1) {
      return onFinish()
    }
    const [ lyric, ...rest ] = lyrics
    server.to(makeRoom('source')(sessionId)).emit('lyric', {sessionId, line: lyric[0] })
    server.to(makeRoom('user')(sessionId)).emit('lyric', {sessionId, line: lyric[0] })
    setTimeout(() => rec(rest), lyric[1])
  }
  return rec(allLyrics)
}

@WebSocketGateway()
@UseInterceptors(new RavenInterceptor({
  context: 'Ws',
} as any))
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  private activeLyrics: string[] = []

  constructor(
    private readonly authService: AuthService,
    private readonly clientService: ClientService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
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

    if (isUser(consumer.v)) {
      const user = await this.userService.findOne(consumer.v.v.id)
      user.sessions.forEach(s => socket.join(makeRoom('user')(s.id)))
    }
  }

  handleDisconnect(socket: Socket) {
    if ((socket as AuthSocket).consumer) {
      const { consumer } = socket as AuthSocket
      if (isClient(consumer)) {
        consumer.v.socket = null
        this.clientService.save(consumer.v)

        const { session } = socket.handshake.query
        if (session) {
          this.sessionService.removeClientFromSession(session, consumer.v)
        }
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

  @SubscribeMessage('start-lyrics')
  @UseGuards(SocketGuard)
  async startLyrics(socket: AuthSocket, data: { sessionId: string }): Promise<void> {
    if (isClient(socket.consumer)) {
      throw new WsException('Forbidden')
    }
    if (this.activeLyrics.find(id => id === data.sessionId)) {
      return
    }
    this.activeLyrics.push(data.sessionId)
    emitLyrics(this.server, data.sessionId, testLyrics, () => this.activeLyrics = this.activeLyrics.filter(id => id !== data.sessionId))
  }

}
