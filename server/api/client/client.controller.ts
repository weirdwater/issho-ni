import { Controller, Get, Post, Body } from '@nestjs/common';
import { Client } from './client.entity';
import { ClientService } from './client.service';
import { CreateClientDTO } from './client.dto';
import * as crypto from 'crypto'

@Controller('api/client')
export class ClientController {

  constructor(private readonly clientService: ClientService) {}

  @Get()
  findAll(): Promise<Client[]> {
    return this.clientService.findAll()
  }

  @Post()
  register(@Body() clientDto: CreateClientDTO): Promise<Client> {
    const client = new Client()
    client.kind = clientDto.kind
    client.key = crypto.randomBytes(10).toString('hex')

    return this.clientService.register(client)
  }

}
