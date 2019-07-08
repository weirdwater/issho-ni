import { IsNotEmpty } from 'class-validator'
import { LyricComponentDTO } from './lyricComponent.dto'
import { ReferenceComponentDTO } from './referenceComponent.dto'

export class CreateSongDTO {

  @IsNotEmpty()
  title: string

  @IsNotEmpty()
  artist: string

  components: Array<LyricComponentDTO | ReferenceComponentDTO>

}
