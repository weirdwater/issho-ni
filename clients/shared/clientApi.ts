import * as Cookie from 'js-cookie';
import { v4 as uuid } from 'uuid';
import { isNone, Maybe, none, some } from '../../shared/fun';
import { ClientDTO, AuthenticateClientDTO } from '../../shared/dto';
import { NoSessionTokenSetException, ApiException } from './apiExceptions';
import { authenticatedHeaders, baseHeaders } from './headers';
import { ClientCredentials, ClientType } from './types';
import { UnauthorizedException } from './apiExceptions/unauthorizedException';
import { string } from 'joi';

export class ClientApi {
  private readonly kind: ClientType
  private readonly idCookie: string
  private readonly keyCookie: string
  private readonly sessionCookie: string

  constructor(kind: ClientType) {
    this.kind = kind
    this.idCookie = `${kind}_client_id`
    this.keyCookie = `${kind}_client_key`
    this.sessionCookie = `${kind}_session_token`
  }

  private saveCredentials(c: ClientCredentials): void {
    Cookie.set(this.idCookie, c.id)
    Cookie.set(this.keyCookie, c.key)
  }

  private saveSessionToken = (t: string) => {
    Cookie.set(this.sessionCookie, t)
  }

  private loadSessionToken(): Maybe<string> {
    const c = Cookie.get(this.sessionCookie)
    return c !== undefined ? some(c) : none()
  }

  public loadCredentials(): Maybe<ClientCredentials> {
    const id = Cookie.get(this.idCookie)
    const key = Cookie.get(this.keyCookie)
    const sessionToken = this.loadSessionToken()

    if (id !== undefined && key !== undefined) {
      return some({ kind: this.kind, id, key, sessionToken })
    }

    return none()
  }

  public clearCredentials(): void {
    Cookie.remove(this.idCookie)
    Cookie.remove(this.keyCookie)
    Cookie.remove(this.sessionCookie)
  }

  public async getClient(c: ClientCredentials): Promise<ClientDTO> {
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
  }

  public async authenticate(c: ClientCredentials): Promise<string> {
    const dto: AuthenticateClientDTO = { id: c.id, key: c.key}
    const res = await fetch('api/auth/client', {
      body: JSON.stringify(dto),
      method: 'POST',
      headers: baseHeaders,
    })

    if (res.status === 401) {
      throw new UnauthorizedException('Could not authenticate client')
    }

    if (res.status !== 201) {
      throw new ApiException(`Could not authenticate client: ${res.statusText}`)
    }

    const token = await res.text()

    this.saveSessionToken(token)
    return token
  }

  public register(): Promise<ClientCredentials> {
    return new Promise((resolve, reject) => {
      const clientRequest = { id: uuid(), kind: this.kind }

      fetch('/api/client/register', {
        body: JSON.stringify(clientRequest),
        method: 'POST',
        headers: baseHeaders,
      })
        .then(res => res.json())
        .then(o => ({...o, sessionToken: none()} as ClientCredentials))
        .then(c => {
            this.saveCredentials(c)
            resolve(c)
        })
        .catch(reject)
    })
  }
}
