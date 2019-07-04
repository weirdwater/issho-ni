import { IsNotEmpty } from 'class-validator'

export class HostSessionDTO {

  @IsNotEmpty()
  key: string

}
