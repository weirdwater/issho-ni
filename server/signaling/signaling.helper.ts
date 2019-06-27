import { Socket } from 'socket.io'
import { Maybe, none, some } from 'shared/fun';

export const sessionTokenFromSocket = (socket: Socket): Maybe<string> => {
  const { authentication } = socket.handshake.headers

  if (!authentication || typeof authentication !== 'string') {
    return none()
  }

  const [ type, token ] = authentication.split(' ')

  if (type !== 'Bearer') {
    return none()
  }

  if (!token) {
    return none()
  }

  return some(token)
}
