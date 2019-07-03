
export class PeerConnectionMissingException extends Error {

  constructor(m?: string) {
    super(m)
    this.name = 'Peer Connection Missing Exception'
  }

}
