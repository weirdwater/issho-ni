import { ClientType, clientTypes } from '../../types'
import { IsNotEmpty, IsUUID, IsIn } from 'class-validator';

export class RegisterClientResponseDTO {

  @IsUUID('4')
  @IsNotEmpty()
  id: string

  @IsIn([...clientTypes])
  @IsNotEmpty()
  kind: ClientType

  @IsNotEmpty()
  key: string
}
