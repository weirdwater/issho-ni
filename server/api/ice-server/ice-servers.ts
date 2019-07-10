import { IceServer } from './ice-server'

export const servers: (credentials: { username: string, credential: string }) => IceServer[] = ({ username, credential }) => [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:issho.app' },
  {
    urls: 'turn:issho.app',
    credentialType: 'password',
    username, credential,
  },
]
