import { SocketException } from './socketException'

export class UnsupportedSDPTypeException extends SocketException {
  constructor(m?: string) {
    super(m)
    this.name = 'Unsupported SDP Type'
  }
}
