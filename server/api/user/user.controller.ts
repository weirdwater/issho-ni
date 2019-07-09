import { Controller,
  Get,
  Param,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
  Session,
} from '@nestjs/common'
import { User } from './user.entity'
import { UserService } from './user.service'
import { CreateUserDTO, SelfUserDTO, UsersSessionDTO } from '../../../shared/dto'
import * as bcrypt from 'bcrypt'
import { NotFoundInterceptor } from '../not-found.interceptor'
import { AuthGuard } from '@nestjs/passport'
import { Consumer, isClient } from '../auth/auth.helpers'
import { SessionService } from '../session/session.service'

@Controller('api/user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  @UseGuards(AuthGuard())
  findAll(): Promise<User[]> {
    return this.userService.findAll()
  }

  @Get('me')
  @UseGuards(AuthGuard())
  self(@Consumer() consumer: Consumer): SelfUserDTO {
    if (isClient(consumer)) {
      throw new ForbiddenException()
    }
    const { id, email, name } = consumer.v
    return { id, email, name }
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id)
  }

  @Get('me/sessions')
  @UseGuards(AuthGuard())
  async findforUser(@Consumer() consumer: Consumer): Promise<UsersSessionDTO[]> {
    if (isClient(consumer)) {
      throw new ForbiddenException()
    }
    const fullUser = await this.userService.findOne(consumer.v.id)
    return this.sessionService.getByIds(fullUser.sessions.map(s => s.id))
  }

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() userDTO: CreateUserDTO): Promise<User> {

    const user = new User()
    user.email = userDTO.email
    user.name = userDTO.name
    user.encryptedPassword = await bcrypt.hash(userDTO.password, 10)

    return this.userService.save(user)
  }

}
