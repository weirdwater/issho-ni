import { HttpException, HttpStatus } from '@nestjs/common'

export class ClientIdExistsException extends HttpException {
  constructor(id?: string) {
    super(id ? `A client with the id ${id} already exists.` : 'A client with the supplied id already exists.', HttpStatus.BAD_REQUEST)
  }
}
