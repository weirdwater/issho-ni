import { BadRequestException } from '@nestjs/common'

export class UserWithEmailExistsException extends BadRequestException {
  constructor(message: string) {
    super(message)
  }
}
