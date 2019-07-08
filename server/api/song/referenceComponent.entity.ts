import { JoinColumn, ChildEntity, Tree, ManyToOne } from 'typeorm';
import { SongComponent } from './songComponent.entity';

@ChildEntity()
export class Reference extends SongComponent {

  componentId: string

}
