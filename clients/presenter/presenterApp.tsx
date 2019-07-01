import * as React from 'react'
import { Maybe, none, isSome, some, Action } from '../../shared/fun';
import { SessionCredentials } from './types';
import { ClientCredentials } from '../shared/types';
import { isNone } from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';

export interface PresenterAppState {
  credentials: Maybe<ClientCredentials>
  sessionCredentials: Maybe<SessionCredentials>
}

export class PresenterApp extends React.Component<{}, PresenterAppState> {
  private authHandler: ClientAuthenticationHandler<PresenterAppState>

  constructor(props: {}) {
    super(props)

    this.state = {
      credentials: none(),
      sessionCredentials: none(),
    }

    this.updateState = this.updateState.bind(this)

    this.authHandler = new ClientAuthenticationHandler<PresenterAppState>('presenter', this.updateState)
  }

  updateState(a: Action<PresenterAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    // tslint:disable-next-line:no-console
    this.authHandler.init().catch(console.log)
  }

  componentDidUpdate(prevProps: {}, prevState: PresenterAppState) {
    this.authHandler.onUpdate(prevState.credentials, this.state.credentials)
  }

  render() {
    return (<section>
      <h1>Presentation</h1>

      <pre>
        { isSome(this.state.credentials) ? JSON.stringify(this.state.credentials, null, 2) : 'no client credentials set'}
      </pre>
      <pre>
        { isSome(this.state.sessionCredentials) ? JSON.stringify(this.state.sessionCredentials, null, 2) : 'no session credentials set'}
      </pre>
    </section>)
  }

}
