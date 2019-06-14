import { Injectable } from '@nestjs/common';
import { Client } from './client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientIdExistsException } from 'server/exceptions/clientIdExists.exception';
import { string } from 'joi';

@Injectable()
export class ClientService {

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  findAll(): Promise<Client[]> {
    return this.clientRepository.find()
  }

  async register(client: Client): Promise<string> {
    try {
      const result = await this.clientRepository.insert(client)
      return result.identifiers.shift().id
    } catch (e) {
      if (e.name === 'QueryFailedError' && e.constraint && (e.constraint as string).substr(0, 2) === 'PK') {
        throw new ClientIdExistsException(client.id)
      }
      throw e
    }
  }

  findOne(id: string): Promise<Client> {
    return this.clientRepository.findOne(id)
  }

}
