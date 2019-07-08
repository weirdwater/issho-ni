import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { SongComponent } from './songComponent.entity';
import { User } from '../user/user.entity';

@Entity()
export class Song {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column()
  artist: string

  @OneToMany(type => SongComponent, sc => sc.song, { eager: true })
  components: SongComponent[]

  @ManyToOne(type => User, u => u.songs)
  owner: User

}
