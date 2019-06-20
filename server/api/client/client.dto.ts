import { ClientType, clientTypes } from '../../../types'
import { IsUUID, IsIn, IsNotEmpty } from 'class-validator'

// tslint:disable-next-line:max-classes-per-file
export class RegisterClientDTO {

  @IsUUID('4')
  id: string

  @IsIn([...clientTypes])
  kind: ClientType

}

export interface RegisterClientResponseDTO {
  id: string
  kind: ClientType
  key: string
}
