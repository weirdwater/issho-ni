import { IsUUID, IsDate } from 'class-validator'
import { ActiveSession } from 'server/api/session/activeSession.entity'

export class JoinSessionDTO {

  @IsUUID('4')
  id: string

  title: string

  owner: {
    name: string,
  }

  activeSession: ActiveSession

  @IsDate()
  created: Date

}
