import { ClientCredentials, ClientType } from './types'
import { none, Maybe, some } from '../../shared/fun';
import { v4 as uuid } from 'uuid'
import * as Cookie from 'js-cookie'

const ClientApi = (kind: ClientType) => {
  const idCookie = `${kind}_client_id`
  const keyCookie = `${kind}_client_key`
  const sessionCookie = `${kind}_session_token`

  const saveCredentials = (c: ClientCredentials) => {
    Cookie.set(idCookie, c.id)
    Cookie.set(keyCookie, c.key)
  }

  const saveSessionToken = (t: string) => {
    Cookie.set(sessionCookie, t)
  }

  return {
    loadCredentials: (): Maybe<ClientCredentials> => {
      const id = Cookie.get(idCookie)
      const key = Cookie.get(keyCookie)

      if (id !== undefined && key !== undefined) {
        return some({ id, key, kind })
      }

      return none()
    },
    authenticate: async (c: ClientCredentials): Promise<void> => {
      const res = await fetch('api/auth/client', {
        body: JSON.stringify(c),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.status !== 201) {
        throw new Error(`Could not authenticate client: ${res.statusText}`)
      }

      const token = await res.text()

      saveSessionToken(token)
    },
    register: (): Promise<ClientCredentials> => new Promise(
      (resolve, reject) => {
        const clientRequest = { id: uuid(), kind }

        fetch('/api/client/register', {
          body: JSON.stringify(clientRequest),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(res => res.json())
          .then((c: ClientCredentials) => {
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
