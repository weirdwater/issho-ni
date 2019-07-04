import { ClientCredentials } from './types'
import { SessionDTO } from '../../shared/dto';
import { NoSessionTokenSetException, ApiException, ActiveSessionNotFoundException } from './apiExceptions';
import { isNone } from '../../shared/fun';
import { authenticatedHeaders } from './headers';

export const sessionApi = (c: ClientCredentials) => {

  return {
    joinSession: async (token: string): Promise<SessionDTO> => {
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
      const dto: SessionDTO = await res.json()

      return dto
    },
    hostSession: async (id: string, key: string): Promise<SessionDTO> => {
      if (isNone(c.sessionToken)) {
        throw new NoSessionTokenSetException(`Cannot host session with id ${id}`)
      }
      const res = await fetch(`/api/session/${id}/host`, {
        method: 'PUT',
        headers: authenticatedHeaders(c.sessionToken.v),
        body: JSON.stringify({ key }),
      })
      if (res.status === 404) {
        throw new ActiveSessionNotFoundException(`Session ${id} with key not found`)
      }
      if (!res.ok) {
        throw new ApiException(`Something went wrong hosting the session with id ${id}: ${res.status} ${res.statusText}`)
      }
      const dto: SessionDTO = await res.json()

      return dto
    },
  }

}
