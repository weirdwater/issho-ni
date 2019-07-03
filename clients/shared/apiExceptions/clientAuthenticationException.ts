import { ApiException } from './apiException'

export class ClientAuthenticationException extends ApiException {

  constructor(m?: string) {
    super(m)
    this.name = 'Client Authentication Exception'
  }

}
