import { Client } from '../client/client.entity'
import { User } from '../user/user.entity'
import { ManyToOne, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Entity } from 'typeorm';

@Entity()
export class Session {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  token: string

  @Column()
  key: string

  @Column()
  title: string

  @ManyToOne(type => User, user => user.sessions)
  owner: User

  @ManyToMany(type => Client, client => client.sessions)
  @JoinTable()
  clients: Client[]

}
