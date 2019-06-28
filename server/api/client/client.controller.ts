import { Controller, Get, Post, Body, UsePipes, ValidationPipe, UseInterceptors, ClassSerializerInterceptor, UseGuards, Param } from '@nestjs/common'
import { Client } from './client.entity'
import { ClientService } from './client.service'
import { RegisterClientDTO, RegisterClientResponseDTO } from '../../../shared/dto'
import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'
import { AuthGuard } from '@nestjs/passport'
import { ClientDTO } from '../../../shared/dto';

@Controller('api/client')
@UseInterceptors(ClassSerializerInterceptor)
export class ClientController {

  constructor(private readonly clientService: ClientService) {}

  @Get()
  @UseGuards(AuthGuard())
  findAll(): Promise<ClientDTO[]> {
    return this.clientService.findAll()
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  getClient(@Param('id') id: string): Promise<ClientDTO> {
    return this.clientService.findOne(id)
  }

  @Post('/register')
  @UsePipes(ValidationPipe)
  async register(@Body() clientDto: RegisterClientDTO): Promise<RegisterClientResponseDTO> {
    const key = crypto.randomBytes(10).toString('hex')
    const hashedKey = await bcrypt.hash(key, 10)

    const client = new Client()
    client.id = clientDto.id
    client.kind = clientDto.kind
    client.hashedKey = hashedKey

    return this.clientService.register(client)
      .then(id => ({ kind: client.kind, id, key }))
  }

}
