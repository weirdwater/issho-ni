
export class SocketException extends Error {
  constructor(m?: string) {
    super(m)
    this.name = 'Socket Exception'
  }
}
