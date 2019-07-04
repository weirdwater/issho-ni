import { ApiException } from './apiException'

export class SessionNotFoundException extends ApiException {

  constructor(m?: string) {
    super(m)
    this.name = 'Session Not Found Exception'
  }

}
