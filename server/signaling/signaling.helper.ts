import { Socket } from 'socket.io'
import { Maybe, none, some } from '../../shared/fun';
import { Consumer, isUser } from '../api/auth/auth.helpers';

export const sessionTokenFromSocket = (socket: Socket): Maybe<string> => {
  const { authorization } = socket.handshake.headers

  if (!authorization || typeof authorization !== 'string') {
    return none()
  }

  const [ type, token ] = authorization.split(' ')

  if (type !== 'Bearer') {
    return none()
  }

  if (!token) {
    return none()
  }

  return some(token)
}

export const makeRoom = (suffix: 'user' | 'source' | 'presenter') => (session: string) => {
  return `${session}_${suffix}`
}

export const roomFromConsumer = (c: Consumer) => makeRoom(isUser(c) ? 'user' : c.v.kind)

export interface AuthSocket extends Socket {
  consumer: Consumer
}
