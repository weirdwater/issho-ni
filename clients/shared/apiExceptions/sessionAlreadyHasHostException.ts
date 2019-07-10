import { ApiException } from './apiException'

export class SessionAlreadyHasHostException extends ApiException {

  constructor(m?: string) {
    super(m)
    this.name = 'Session Already Has Host Exception'
  }

}
