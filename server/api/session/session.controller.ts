import { Controller, Get } from '@nestjs/common';

@Controller('api/session')
export class SessionController {

  @Get()
  findAll(): string {
    return 'session'
  }

}
