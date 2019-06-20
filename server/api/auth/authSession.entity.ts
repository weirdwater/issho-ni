import { PrimaryColumn, Column, OneToMany, OneToOne, JoinColumn, CreateDateColumn, Entity } from 'typeorm'
import { Client } from '../client/client.entity'
import { User } from '../user/user.entity'

@Entity()
export class AuthSession {

  @PrimaryColumn()
  token: string

  @Column()
  address: string

  @OneToOne(type => Client)
  @JoinColumn()
  client: Client

  @OneToOne(type => User)
  @JoinColumn()
  user: User

  @CreateDateColumn()
  created: Date

}
