import { ClientType } from '../../shared/types'
import { ClientCredentials, StateUpdater } from './types';
import { Maybe, Action, isNone, some, isSome, none } from '../../shared/fun';
import { ClientApi } from './clientApi';

export interface AuthClientState {
  credentials: Maybe<ClientCredentials>,
}

export class ClientAuthenticationHandler<a extends AuthClientState> {
  private api: ClientApi
  private updateState: StateUpdater<a>

  constructor(clientType: ClientType, updateState: StateUpdater<a>) {
    this.api = new ClientApi(clientType)
    this.updateState = updateState
  }

  private updateClientSessionToken(sessionToken: Maybe<string>): Action<a> {
    return s => isNone(s.credentials) ? s : { ...s, credentials: some({ ...s.credentials.v, sessionToken }) }
  }

  public async init(): Promise<void> {
    const credentials = this.api.loadCredentials()

    if (isNone(credentials)) {
      const c = await this.api.register().catch(err => { throw err })
      this.updateState(s => ({...s, credentials: some(c)}))
    }

    this.updateState(s => ({...s, credentials}))
  }

  public onUpdate(c0: Maybe<ClientCredentials>, c1: Maybe<ClientCredentials>): void {
    if (isSome(c1) && isNone(c1.v.sessionToken) && (isNone(c0) || isSome(c0.v.sessionToken))) {
      this.api.authenticate(c1.v)
        .then(token => this.updateState(this.updateClientSessionToken(some(token))))
        .catch(e => {if (e.name === 'Unauthorized') {
          // tslint:disable-next-line:no-console
          console.error('Could not authenticate using stored credentials, re-registering client.')
          this.api.clearCredentials()
          this.api.register()
            .then(c => this.updateState(s => ({...s, credentials: some(c)})))
            // tslint:disable-next-line:no-console
            .catch(console.error)
          this.updateState(s => ({...s, credentials: none()}))
        }})
        // tslint:disable-next-line:no-console
        .catch(e => console.error('Could not authenticate client', e))
    }

    if (isSome(c1) && isSome(c1.v.sessionToken) && (isNone(c0) || isNone(c0.v.sessionToken))) {
      // Check if session token works
      this.api.getClient(c1.v).catch((e: Error) => {
        if (e.name === 'Unauthorized') {
          // tslint:disable-next-line:no-console
          console.error('Could not continue session, re-authenticating')
          return this.updateState(this.updateClientSessionToken(none()))
        }
        throw e
      })
    }
  }

}
