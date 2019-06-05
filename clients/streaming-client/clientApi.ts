import { ClientCredentials } from './types'
import { none, Maybe, some } from '../shared/fun';
import * as Cookie from 'js-cookie'

const clientIdCookie = 'client_id'
const clientKeyCookie = 'client_key'

export const loadCredentials = (): Maybe<ClientCredentials> => {

  const id = Cookie.get(clientIdCookie)
  const key = Cookie.get(clientKeyCookie)

  if (id !== undefined && key !== undefined) {
    return some({ id, key })
  }

  return none()
}

const saveCredentials = (c: ClientCredentials): void => {
  Cookie.set(clientIdCookie, c.id)
  Cookie.set(clientKeyCookie, c.key)
}

export const registerClient = (): Promise<ClientCredentials> => new Promise(
  (resolve, reject) => {
    const testC = { id: 'test', key: 'test1234' }
    saveCredentials(testC)
    // reject('Error while trying to register the client: The server could not be reached.')
    resolve(testC)
  },
)
