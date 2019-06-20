import { Controller, Get, Post, Body, UsePipes, ValidationPipe, UseInterceptors, ClassSerializerInterceptor, UseGuards } from '@nestjs/common'
import { Client } from './client.entity'
import { ClientService } from './client.service'
import { RegisterClientDTO, RegisterClientResponseDTO } from './client.dto'
import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'
import { AuthGuard } from '@nestjs/passport'

@Controller('api/client')
@UseInterceptors(ClassSerializerInterceptor)
export class ClientController {

  constructor(private readonly clientService: ClientService) {}

  @Get()
  @UseGuards(AuthGuard())
  findAll(): Promise<Client[]> {
    return this.clientService.findAll()
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
