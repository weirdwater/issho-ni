import { PrimaryGeneratedColumn, Column, ManyToMany, Entity } from 'typeorm'
import { Session } from '../session/session.entity'
import { ClientType } from 'types';

@Entity()
export class Client {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  key: string

  @Column({
    type: 'enum',
    enum: ['source', 'presenter'],
    default: 'source',
  })
  kind: ClientType

  @ManyToMany(type => Session, session => session.clients)
  sessions: Session[]
}
