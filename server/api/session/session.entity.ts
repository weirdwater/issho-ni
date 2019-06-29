import { Client } from '../client/client.entity'
import { User } from '../user/user.entity'
import { ManyToOne, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Entity, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ActiveSession } from './activeSession.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Session {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Exclude()
  @Column()
  key: string

  @Column()
  title: string

  @ManyToOne(type => User, user => user.sessions)
  owner: User

  @ManyToMany(type => Client, client => client.sessions)
  @JoinTable()
  clients: Client[]

  @OneToOne(type => Client)
  @JoinColumn()
  presenter: Client

  @OneToOne(type => ActiveSession, activeSession => activeSession.session)
  activeSession: ActiveSession

  @CreateDateColumn()
  created: Date
}
