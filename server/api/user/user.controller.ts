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
} from '@nestjs/common'
import { User } from './user.entity'
import { UserService } from './user.service'
import { CreateUserDTO, SelfUserDTO } from '../../../shared/dto'
import * as bcrypt from 'bcrypt'
import { NotFoundInterceptor } from '../not-found.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { Consumer, isClient } from '../auth/auth.helpers';

@Controller('api/user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

  constructor(private readonly userService: UserService) {}

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
