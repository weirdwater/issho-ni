import { IsUUID, Allow, IsDate, IsNotEmpty } from 'class-validator'
import { ActiveSession } from '../../../server/api/session/activeSession.entity'

export class UsersSessionDTO {

  @IsUUID('4')
  id: string

  @Allow()
  title: string

  @Allow()
  owner: {
    name: string,
  }

  @Allow()
  activeSession: ActiveSession

  @IsDate()
  created: Date

  @IsNotEmpty()
  key: string

}
