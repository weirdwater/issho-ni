import { ClientType, clientTypes } from '../../types'
import { IsUUID, IsIn, IsNotEmpty, IsDate } from 'class-validator'

export class ClientDTO {

  @IsUUID('4')
  @IsNotEmpty()
  id: string

  @IsIn([...clientTypes])
  @IsNotEmpty()
  kind: ClientType

  descriptor: string

  @IsDate()
  created: Date

}
