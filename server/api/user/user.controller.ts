import { Controller, Get, Param, Post, Body, UseInterceptors, ClassSerializerInterceptor, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { User } from './user.entity'
import { UserService } from './user.service'
import { CreateUserDTO } from '../../../shared/dto'
import * as bcrypt from 'bcrypt'
import { NotFoundInterceptor } from '../not-found.interceptor';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard())
  findAll(): Promise<User[]> {
    return this.userService.findAll()
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
