import { ClientCredentials } from './types'
import { JoinSessionDTO } from '../../shared/dto';
import { NoSessionTokenSetException, ApiException, ActiveSessionNotFoundException } from './apiExceptions';
import { isNone } from '../../shared/fun';
import { authenticatedHeaders } from './headers';

export const sessionApi = (c: ClientCredentials) => {

  return {
    joinSession: async (token: string): Promise<JoinSessionDTO> => {
      if (isNone(c.sessionToken)) {
        throw new NoSessionTokenSetException(`Cannot join session with token ${token}`)
      }
      const res = await fetch(`/api/session/${token}/join`, {
        headers: authenticatedHeaders(c.sessionToken.v),
      })
      if (res.status === 404) {
        throw new ActiveSessionNotFoundException(`Active session ${token} not found`)
      }
      if (!res.ok) {
        throw new ApiException(`Something went wrong joining the session with token ${token}: ${res.status} ${res.statusText}`)
      }
      const dto: JoinSessionDTO = await res.json()

      return dto
    },
  }

}
