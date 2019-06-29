import { IsUUID, IsIn, IsNotEmpty } from 'class-validator'
import { ClientType, clientTypes } from '../../types'

export class RegisterClientDTO {

  @IsUUID('4')
  @IsNotEmpty()
  id: string

  @IsIn([...clientTypes])
  @IsNotEmpty()
  kind: ClientType

}
