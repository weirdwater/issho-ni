import { IsUUID, IsNotEmpty } from 'class-validator'

export class AuthenticateClientDTO {

  @IsUUID('4')
  id: string

  @IsNotEmpty()
  key: string

}
