import { Session } from '../session/session.entity'
import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm'
import { Exclude } from 'class-transformer'

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Exclude()
  @Column()
  encryptedPassword: string

  @Column()
  name: string

  @Exclude()
  @Column({ default: false })
  emailConfirmed: boolean

  @Exclude()
  @Column({ default: false })
  active: boolean

  @OneToMany(type => Session, session => session.owner)
  sessions: Session[]
}
