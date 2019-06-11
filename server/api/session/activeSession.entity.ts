import { Entity, PrimaryColumn, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Session } from './session.entity';

@Entity()
export class ActiveSession {

  @PrimaryColumn()
  token: string

  @OneToOne(type => Session, session => session.activeSession)
  @JoinColumn()
  session: Session

  @CreateDateColumn()
  created: Date

}
