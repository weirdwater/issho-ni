import { Socket } from 'socket.io'
import { Maybe, none, some } from 'shared/fun';

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
