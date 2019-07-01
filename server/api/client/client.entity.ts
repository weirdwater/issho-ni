import { PrimaryGeneratedColumn, Column, ManyToMany, Entity, CreateDateColumn } from 'typeorm'
import { Session } from '../session/session.entity'
import { ClientType, clientTypes } from '../../../shared/types';
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

  @Column({ nullable: true })
  socket: string

  @ManyToMany(type => Session, session => session.clients)
  sessions: Session[]

  @CreateDateColumn()
  created: Date
}
