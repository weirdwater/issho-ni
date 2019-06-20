import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { UserWithEmailExistsException } from '../../exceptions/userWithEmailExists.exception';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepository.find()
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne(id, { relations: ['sessions'] })
    return user
  }

  async save(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user)
    } catch (e) {
      if (e.name && e.name === 'QueryFailedError' && e.constraint && (e.constraint as string).substr(0, 2) === 'UQ') {
        throw new UserWithEmailExistsException(`A user with the email ${user.email} already exists.`)
      }
      throw e
    }
  }

}
