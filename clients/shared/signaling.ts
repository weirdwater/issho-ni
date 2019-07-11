import { ClientCredentials } from './types'
import io from 'socket.io-client';
import { bearerToken } from './headers';
import { isSome, Action, Maybe } from '../../shared/fun';
import { SocketState } from '../streaming-client/types';
import { SocketException } from './socketExceptions/socketException';
import { DescriptorDTO, SourceDTO, CandidateDTO } from '../../shared/dto';

export const openSocket = <a extends { socket: SocketState }>(
  sessionToken: Maybe<string>,
  updateSocketStatus: (f: Action<a>) => void,
  query?: { [param: string]: string },
): SocketIOClient.Socket => {
  const headers = isSome(sessionToken) ? bearerToken(sessionToken.v)({}) : {}

  const socket = io(`/`, {
    query,
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

export const closeSocket = <a extends { socket: SocketState }>(socket: SocketIOClient.Socket, updateSocketStatus: (f: Action<a>) => void) => {
  socket.close()
  updateSocketStatus(s => ({...s, socket: 'disconnected' }))
}

export const emitDescriptor = (s: SocketIOClient.Socket) => (dto: SourceDTO<DescriptorDTO>) => {
  s.emit('descriptor', dto)
}

export const emitCandidate = (s: SocketIOClient.Socket) => (dto: SourceDTO<CandidateDTO>) => {
  s.emit('candidate', dto)
}
