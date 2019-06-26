import { Body, ClassSerializerInterceptor, Controller, ForbiddenException, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'crypto';
import { Consumer, isUser } from '../auth/auth.helpers';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { User } from '../user/user.entity';
import { CreateSessionDTO } from './session.dto';
import { Session } from './session.entity';
import { SessionService } from './session.service';

@Controller('api/session')
@UseInterceptors(ClassSerializerInterceptor)
export class SessionController {

  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @UseGuards(AuthGuard())
  findAll(): Promise<Session[]> {
    return this.sessionService.findAll()
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  @UseInterceptors(NotFoundInterceptor)
  getOne(@Param('id') id: number): Promise<Session> {
    return this.sessionService.findOne(id)
  }

  @Post()
  @UseGuards(AuthGuard())
  create(@Body() sessionDto: CreateSessionDTO): Promise<Session> {
    const user = new User()
    user.id = sessionDto.owner

    const session = new Session()
    session.owner = user
    session.title = sessionDto.title
    session.key = crypto.randomBytes(10).toString('hex')

    return this.sessionService.save(session)
  }

  @Get(':token/join')
  @UseGuards(AuthGuard())
  async join(@Param('token') token: string, @Consumer() consumer: Consumer): Promise<Session> {
    if (isUser(consumer)) {
      throw new ForbiddenException()
    }
    const active = await this.sessionService.findActive(token)
    const session = await this.sessionService.findOne(active.session.id)
    session.clients.push(consumer.v)

    return this.sessionService.save(session)
  }

  @Get(':id/activate')
  @UseGuards(AuthGuard())
  activate(@Param('id') id: number): Promise<string> {
    return this.sessionService.activate(id)
  }

  @Get(':id/deactivate')
  @UseGuards(AuthGuard())
  deactivate(@Param('id') id: number): Promise<boolean> {
    return this.sessionService.deactivate(id)
  }

}
