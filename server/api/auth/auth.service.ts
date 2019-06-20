import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSession } from './authSession.entity';
import * as crypto from 'crypto'
import { Maybe, none, some, left, right } from 'shared/fun';
import { Consumer } from './auth.helpers';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
  ) {}

  async create(session: AuthSession): Promise<string> {
    session.token = crypto.randomBytes(16).toString('hex')

    try {
      if (session.user) {
        await this.authSessionRepository.delete({ user: session.user })
      }
      if (session.client) {
        await this.authSessionRepository.delete({ client: session.client })
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

}
