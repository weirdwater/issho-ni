import { Controller, Get, Param, Post, Body, UseInterceptors } from '@nestjs/common'
import { User } from './user.entity'
import { UserService } from './user.service'
import { CreateUserDTO } from './user.dto'
import * as bcrypt from 'bcrypt'
import { NotFoundInterceptor } from '../not-found.interceptor';

@Controller('api/user')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll()
  }

  @Get(':id')
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id)
  }

  @Post()
  async create(@Body() userDTO: CreateUserDTO): Promise<User> {

    const user = new User()
    user.email = userDTO.email
    user.name = userDTO.name
    user.encryptedPassword = await bcrypt.hash(userDTO.password, 10)

    return this.userService.save(user)
  }

}
