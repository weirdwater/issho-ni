import { Controller, Get, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { Client } from './client.entity';
import { ClientService } from './client.service';
import { RegisterClientDTO, RegisterClientResponseDTO, AuthenticateClientDTO } from './client.dto';
import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'

@Controller('api/client')
export class ClientController {

  constructor(private readonly clientService: ClientService) {}

  @Get()
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
      .then(() => ({ id: client.id, kind: client.kind, key }))
  }

  @Post('/authenticate')
  @UsePipes(ValidationPipe)
  async authenticate(@Body() clientDto: AuthenticateClientDTO): Promise<boolean> {
    const client = await this.clientService.findOne(clientDto.id)

    return bcrypt.compare(clientDto.key, client.hashedKey)
  }

}
