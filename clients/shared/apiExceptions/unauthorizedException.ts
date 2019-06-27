import { ApiException } from './apiException'

export class UnauthorizedException extends ApiException {
  constructor(m?: string) {
    super(m)
    this.name = 'Unauthorized'
  }
}
