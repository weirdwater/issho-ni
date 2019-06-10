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

  register(client: Client): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.clientRepository.insert(client)
        .then(() => resolve(true))
        .catch(e => {
          if (e.name === 'QueryFailedError' && e.constraint && (e.constraint as string).substr(0, 2) === 'PK') {
            // TODO: use nestjs' Exception filter workflow
            return reject(`Client with uuid ${client.id} already exists.`)
          }
          reject(e)
         })
    })
  }

  findOne(id: string): Promise<Client> {
    return this.clientRepository.findOne(id)
  }

}
