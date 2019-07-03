import { ClientCredentials } from './types'
import io from 'socket.io-client';
import { bearerToken } from './headers';
import { isSome, Action } from '../../shared/fun';
import { SocketState } from '../streaming-client/types';
import { SocketException } from './socketExceptions/socketException';

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
  socket.on('exception', (data: any) => { throw new SocketException(data) })

  return socket
}
