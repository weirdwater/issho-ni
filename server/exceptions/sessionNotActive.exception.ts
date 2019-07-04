import { UnprocessableEntityException } from '@nestjs/common'

export class SessionNotActiveException extends UnprocessableEntityException {
  constructor(m?: string) {
    super(m || 'Session has not been activated yet')
  }
}
