import { Column, Entity, PrimaryGeneratedColumn, TableInheritance, ManyToOne } from 'typeorm';
import { Song } from './song.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class SongComponent {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @ManyToOne(type => Song, s => s.components)
  song: Song

  @Column()
  order: number

}
