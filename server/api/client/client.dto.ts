import { ClientType, clientTypes } from 'types'
import { IsUUID, IsIn, IsNotEmpty } from 'class-validator'

export class AuthenticateClientDTO {

  @IsUUID('4')
  id: string

  @IsNotEmpty()
  key: string

}

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
