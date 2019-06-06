import { ClientCredentials, ClientType } from './types'
import { none, Maybe, some } from './fun';
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
        const testC = { id: 'test', key: 'test1234', kind }
        saveCredentials(testC)
        // reject('Error while trying to register the client: The server could not be reached.')
        resolve(testC)
      },
    ),
  }
}

export const sourceClient = ClientApi('source')

export const preseterClient = ClientApi('presenter')
