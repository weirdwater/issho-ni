import { PrimaryGeneratedColumn, Column, ManyToMany, Entity, CreateDateColumn } from 'typeorm'
import { Session } from '../session/session.entity'
import { ClientType, clientTypes } from 'types';
import { Exclude } from 'class-transformer';

@Entity()
export class Client {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Exclude()
  @Column()
  hashedKey: string

  @Column({
    type: 'enum',
    enum: clientTypes,
    default: 'source',
  })
  kind: ClientType

  @ManyToMany(type => Session, session => session.clients)
  sessions: Session[]

  @CreateDateColumn()
  created: Date
}
