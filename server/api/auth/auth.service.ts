import { Injectable, NotImplementedException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { AuthSession } from './authSession.entity'
import * as crypto from 'crypto'
import { Maybe, none, some, left, right, isLeft, isRight } from '../../../shared/fun'
import { Consumer } from './auth.helpers'
import { AuthenticateUserDTO } from './authenticateUser.dto'
import { User } from '../user/user.entity'
import { AuthenticateClientDTO } from './authenticateClient.dto'
import { Client } from '../client/client.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(session: AuthSession): Promise<string> {
    session.token = crypto.randomBytes(16).toString('hex')

    try {
      if (session.user) {
        await this.deAuth(left(session.user))
      }
      if (session.client) {
        await this.deAuth(right(session.client))
      }

      const result = await this.authSessionRepository.insert(session)
      return String(result.identifiers.shift().token)
    } catch (e) {
      if (e.name === 'QueryFailedError' && e.constraint && (e.constraint as string).substr(0, 2) === 'PK') {
        // tslint:disable-next-line:no-console
        console.log(`Session id ${session.token} already exists, retrying...`)
        this.create(session)
      }
      throw e
    }
  }

  async validate(token: string): Promise<Maybe<Consumer>> {
    const session = await this.authSessionRepository.findOne(token, { relations: ['user', 'client'] })

    if (session === undefined) {
      return none()
    }

    if (session.user) {
      return some(left(session.user))
    }

    if (session.client) {
      return some(right(session.client))
    }

    return none()
  }

  private authenticateConsumer<a>(getHashedKey: (_: a) => string, key: string): (entity: a) => Promise<Maybe<a>> {
    return async (consumer: a): Promise<Maybe<a>> => {
      if (consumer === undefined) {
        return none()
      }

      const matches = await bcrypt.compare(key, getHashedKey(consumer))

      if (matches) {
        return some(consumer)
      }

      return none()
    }
  }

  authenticateUser(credentials: AuthenticateUserDTO): Promise<Maybe<User>> {
    return this.userRepository.findOne({ email: credentials.email })
            .then(this.authenticateConsumer(u => u.encryptedPassword, credentials.password))

  }

  authenticateClient(credentials: AuthenticateClientDTO): Promise<Maybe<Client>> {
    return this.clientRepository.findOne({ id: credentials.id })
            .then(this.authenticateConsumer(c => c.hashedKey, credentials.key))
  }

  async deAuth(consumer: Consumer): Promise<boolean> {
    const criteria = isLeft(consumer) ? { user: consumer.v } : { client: consumer.v }
    const r = await this.authSessionRepository.delete(criteria)
    return 0 < r.affected
  }
}
