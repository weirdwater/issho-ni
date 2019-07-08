import { IsUUID, IsString, Contains } from 'class-validator'

export class LyricComponentDTO {

  @Contains('lyric')
  kind: 'lyric'

  @IsUUID('4')
  id: string

  @IsString()
  name: string

  @IsString({ each: true })
  lines: string[]

}
