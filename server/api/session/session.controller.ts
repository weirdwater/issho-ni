import { Controller, Get, Param, Post, Body, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { SessionService } from './session.service';
import { Session } from './session.entity';
import { CreateSessionDTO } from './session.dto';
import { User } from '../user/user.entity';
import * as crypto from 'crypto'
import { NotFoundInterceptor } from '../not-found.interceptor';

@Controller('api/session')
@UseInterceptors(ClassSerializerInterceptor)
export class SessionController {

  constructor(private readonly sessionService: SessionService) {}

  @Get()
  findAll(): Promise<Session[]> {
    return this.sessionService.findAll()
  }

  @Get(':id')
  @UseInterceptors(NotFoundInterceptor)
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

  @Get(':token/join')
  async join(@Param('token') token: string): Promise<Session> {
    const { session } = await this.sessionService.findFromToken(token)

    // add client to session
    // save session

    return session
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
