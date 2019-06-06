import { ClientType } from 'types'

export class CreateClientDTO {
  id: string
  kind: ClientType
  key: string
}
