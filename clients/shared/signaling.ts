import { ClientCredentials } from './types'
import io from 'socket.io-client';
import { bearerToken } from './headers';
import { isSome, Action } from '../../shared/fun';
import { SocketState } from '../streaming-client/types';
import { SocketException } from './socketExceptions/socketException';
import { DescriptorDTO, SourceDTO, CandidateDTO } from '../../shared/dto';

export const signalingSocket = <a extends { socket: SocketState }>(
  c: ClientCredentials,
  sessionId: string,
  updateSocketStatus: (f: Action<a>) => void,
): SocketIOClient.Socket => {
  const headers = isSome(c.sessionToken) ? bearerToken(c.sessionToken.v)({}) : {}

  const socket = io(`/?session=${sessionId}`, {
    transportOptions: {
      polling: {
        extraHeaders: headers,
      },
    },
  })

  socket.on('connect', () => updateSocketStatus(s => ({...s, socket: 'connected'})))
  socket.on('disconnect', () => updateSocketStatus(s => ({...s, socket: 'disconnected'})))
  socket.on('exception', (data: { status: string, message: string }) => { throw new SocketException(`${data.status}: ${data.message}`) })

  return socket
}

export const emitDescriptor = (s: SocketIOClient.Socket) => (dto: SourceDTO<DescriptorDTO>) => {
  s.emit('descriptor', dto)
}

export const emitCandidate = (s: SocketIOClient.Socket) => (dto: SourceDTO<CandidateDTO>) => {
  s.emit('candidate', dto)
}
