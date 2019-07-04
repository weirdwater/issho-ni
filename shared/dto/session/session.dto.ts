import { IsUUID, IsDate, Allow } from 'class-validator'
import { ActiveSession } from '../../../server/api/session/activeSession.entity'

export class SessionDTO {

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

}
