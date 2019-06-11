import { ClientCredentials, ClientType } from './types'
import { none, Maybe, some } from './fun';
import { v4 as uuid } from 'uuid'
import * as Cookie from 'js-cookie'

const ClientApi = (kind: ClientType) => {
  const idCookie = `${kind}_client_id`
  const keyCookie = `${kind}_client_key`

  const saveCredentials = (c: ClientCredentials) => {
    Cookie.set(idCookie, c.id)
    Cookie.set(keyCookie, c.key)
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
