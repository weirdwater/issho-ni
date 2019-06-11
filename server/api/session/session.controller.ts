import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { SessionService } from './session.service';
import { Session } from './session.entity';
import { CreateSessionDTO } from './session.dto';
import { User } from '../user/user.entity';
import * as crypto from 'crypto'

@Controller('api/session')
export class SessionController {

  constructor(private readonly sessionService: SessionService) {}

  @Get()
  findAll(): Promise<Session[]> {
    return this.sessionService.findAll()
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<Session> {
    return this.sessionService.findOne(id)
  }

  @Post()
  create(@Body() sessionDto: CreateSessionDTO): Promise<Session> {
    const user = new User()
    user.id = sessionDto.owner

    const session = new Session()
    session.owner = user
    session.title = sessionDto.title
    session.key = crypto.randomBytes(10).toString('hex')

    return this.sessionService.create(session)
  }

  @Get(':id/activate')
  activate(@Param('id') id: number): Promise<string> {
    return this.sessionService.activate(id)
  }

  @Get(':id/deactivate')
  deactivate(@Param('id') id: number): Promise<boolean> {
    return this.sessionService.deactivate(id)
  }

}
