import { Action, Maybe, Some } from '../../shared/fun'

export type StateUpdater<a> = (a: Action<a>, callback?: () => void) => void

export type ClientType = 'source' | 'presenter'

export interface ClientCredentials {
  id: string
  key: string
  kind: ClientType
  sessionToken: Maybe<string>
}
