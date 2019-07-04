import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'crypto';
import { Consumer, isUser } from '../auth/auth.helpers';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { User } from '../user/user.entity';
import { CreateSessionDTO, SessionDTO, HostSessionDTO } from '../../../shared/dto';
import { Session } from './session.entity';
import { SessionService } from './session.service';
import { SessionNotActiveException } from '../../exceptions/sessionNotActive.exception';

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
  getOne(@Param('id') id: string): Promise<Session> {
    return this.sessionService.findOne({ id })
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
  async join(@Param('token') token: string, @Consumer() consumer: Consumer): Promise<SessionDTO> {
    if (isUser(consumer)) {
      throw new ForbiddenException()
    }
    const active = await this.sessionService.findActive(token)

    if (!active) {
      throw new NotFoundException()
    }

    const session = await this.sessionService.findOne({ id: active.session.id })
    session.clients.push(consumer.v)

    return this.sessionService.save(session)
  }

  @Put(':id/host')
  @UseGuards(AuthGuard())
  async host(@Param('id') id: string, @Consumer() consumer: Consumer, @Body() dto: HostSessionDTO): Promise<SessionDTO> {
    if (isUser(consumer) || consumer.v.kind !== 'presenter') {
      throw new ForbiddenException()
    }
    const session = await this.sessionService.findOne({ id, key: dto.key})

    if (session === undefined) {
      throw new NotFoundException('Session not found')
    }

    if (session.activeSession === undefined) {
      throw new SessionNotActiveException()
    }

    session.presenter = consumer.v

    return this.sessionService.save(session)
  }

  @Put(':id/activate')
  @UseGuards(AuthGuard())
  activate(@Param('id') id: number): Promise<string> {
    return this.sessionService.activate(id)
  }

  @Put(':id/deactivate')
  @UseGuards(AuthGuard())
  deactivate(@Param('id') id: number): Promise<boolean> {
    return this.sessionService.deactivate(id)
  }

}
