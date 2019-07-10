import { IsNotEmpty, Allow } from 'class-validator'

export class HostSessionDTO {

  @IsNotEmpty()
  key: string

  @Allow()
  force?: boolean

}
