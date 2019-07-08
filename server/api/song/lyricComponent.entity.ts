import { Column, ChildEntity } from 'typeorm';
import { SongComponent } from './songComponent.entity';

@ChildEntity()
export class Lyric extends SongComponent {

  @Column('simple-array')
  lines: string[]

}
