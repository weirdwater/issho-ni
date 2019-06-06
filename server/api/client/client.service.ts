import { Injectable } from '@nestjs/common';
import { Client } from './client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ClientService {

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  findAll(): Promise<Client[]> {
    return this.clientRepository.find()
  }

  register(client: Client): Promise<Client> {
    return new Promise((resolve, reject) => {
      this.clientRepository.save(client)
        .then(resolve)
        .catch(reject)
    })
  }

}
