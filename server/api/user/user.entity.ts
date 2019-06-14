import { Session } from '../session/session.entity'
import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm'

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  encryptedPassword: string

  @Column()
  name: string

  @Column({ default: false })
  emailConfirmed: boolean

  @Column({ default: false })
  active: boolean

  @OneToMany(type => Session, session => session.owner)
  sessions: Session[]
}
