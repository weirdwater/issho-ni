import { ApiException } from './apiException'

export class ActiveSessionNotFoundException extends ApiException {

  constructor(m?: string) {
    super(m)
    this.name = 'ActiveSession Not Found'
  }

}
