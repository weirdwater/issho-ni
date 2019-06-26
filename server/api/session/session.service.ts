import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { Repository, Connection } from 'typeorm';
import * as crypto from 'crypto'
import { ActiveSession } from './activeSession.entity';

@Injectable()
export class SessionService {

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(ActiveSession)
    private readonly activeSessionRepository: Repository<ActiveSession>,
  ) {}

  findAll(): Promise<Session[]> {
    return this.sessionRepository.find()
  }

  findOne(sessionId: number): Promise<Session> {
    return this.sessionRepository.findOne(sessionId, { relations: ['activeSession', 'owner', 'clients', 'presenter']})
  }

  save(session: Session): Promise<Session> {
    return this.sessionRepository.save(session)
  }

  async activate(sessionId: number): Promise<string> {
    // Check if session is not already active
    const session = await this.sessionRepository.findOne(sessionId, { relations: ['activeSession'] })
    if (session.activeSession && typeof session.activeSession.token === 'string' ) {
      return session.activeSession.token
    }

    // Insert active session
    const activeSession = new ActiveSession()
    activeSession.token = crypto.randomBytes(2).toString('hex')
    activeSession.session = session

    try {
      const result = await this.activeSessionRepository.insert(activeSession)
      return result.identifiers.shift().token
    } catch (e) {
      if (e.name === 'QueryFailedError' && e.constraint && (e.constraint as string).substr(0, 2) === 'PK') {
        // tslint:disable-next-line:no-console
        console.error(`Token ${activeSession.token} already exists for active sessions. Retrying insert with new token.`)
        this.activate(sessionId)
      }
      throw e
    }
  }

  deactivate(sessionId: number): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const session = await this.sessionRepository.findOne(sessionId, { relations: ['activeSession'] })

        const res = await this.activeSessionRepository.delete(session.activeSession.token)
        resolve(res.affected >= 1)
      } catch (e) {
        reject(e)
      }
    })
  }

  async findActive(token: string): Promise<ActiveSession> {
    const activeSession = await this.activeSessionRepository.findOne(token, { relations: ['session'] })

    if (activeSession === undefined) {
      throw new NotFoundException('Active session with the token ${token} not found.')
    }

    return activeSession
  }

}
