import { ApiException } from './apiException'

export class NoSessionTokenSetException extends ApiException {

  constructor(m?: string) {
    super(m)
    this.name = 'NoSessionTokenSet'
  }

}
