import { Session } from '../session/session.entity'
import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm'

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  email: string

  @Column()
  encryptedPassword: string

  @Column()
  salt: string

  @Column()
  name: string

  @Column()
  emailConfirmed: boolean

  @Column()
  active: boolean

  @OneToMany(type => Session, session => session.owner)
  sessions: Session[]
}
