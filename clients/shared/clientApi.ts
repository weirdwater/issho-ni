import * as Cookie from 'js-cookie';
import { v4 as uuid } from 'uuid';
import { isNone, Maybe, none, some } from '../../shared/fun';
import { NoSessionTokenSetException, ApiException } from './apiExceptions';
import { authenticatedHeaders, baseHeaders } from './headers';
import { ClientCredentials, ClientType } from './types';
import { UnauthorizedException } from './apiExceptions/unauthorizedException';

const ClientApi = (kind: ClientType) => {
  const idCookie = `${kind}_client_id`
  const keyCookie = `${kind}_client_key`
  const sessionCookie = `${kind}_session_token`

  const saveCredentials = (c: ClientCredentials) => {
    Cookie.set(idCookie, c.id)
    Cookie.set(keyCookie, c.key)
  }

  const getSessionToken = (): Maybe<string> => {
    const c = Cookie.get(sessionCookie)
    return c !== undefined ? some(c) : none()
  }

  const saveSessionToken = (t: string) => {
    Cookie.set(sessionCookie, t)
  }

  return {
    loadCredentials: (): Maybe<ClientCredentials> => {
      const id = Cookie.get(idCookie)
      const key = Cookie.get(keyCookie)
      const sessionToken = getSessionToken()

      if (id !== undefined && key !== undefined) {
        return some({ id, key, kind, sessionToken })
      }

      return none()
    },
    getClient: async (c: ClientCredentials): Promise<any> => {
      if (isNone(c.sessionToken)) {
        throw new NoSessionTokenSetException()
      }
      const res = await fetch(`api/client/${c.id}`, {
        headers: authenticatedHeaders(c.sessionToken.v),
      })
      if (res.status === 401) {
        throw new UnauthorizedException()
      }
      if (!res.ok) {
        throw new ApiException(res.statusText)
      }
      return res.json()
    },
    authenticate: async (c: ClientCredentials): Promise<string> => {
      const res = await fetch('api/auth/client', {
        body: JSON.stringify(c),
        method: 'POST',
        headers: baseHeaders,
      })

      if (res.status !== 201) {
        throw new Error(`Could not authenticate client: ${res.statusText}`)
      }

      const token = await res.text()

      saveSessionToken(token)
      return token
    },
    register: (): Promise<ClientCredentials> => new Promise(
      (resolve, reject) => {
        const clientRequest = { id: uuid(), kind }

        fetch('/api/client/register', {
          body: JSON.stringify(clientRequest),
          method: 'POST',
          headers: baseHeaders,
        })
          .then(res => res.json())
          .then(o => ({...o, sessionToken: none()} as ClientCredentials))
          .then(c => {
              saveCredentials(c)
              resolve(c)
          })
          .catch(reject)
      },
    ),
  }
}

export const sourceClient = ClientApi('source')

export const preseterClient = ClientApi('presenter')
