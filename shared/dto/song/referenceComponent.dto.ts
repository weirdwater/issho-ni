import { IsUUID, Contains } from 'class-validator'

export class ReferenceComponentDTO {

  @Contains('reference')
  kind: 'reference'

  @IsUUID('4')
  id: string

  @IsUUID('4')
  componentId: string

  name: string

}
