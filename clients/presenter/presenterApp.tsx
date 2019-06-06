import * as React from 'react'
import { Maybe, none, isSome, some } from '../shared/fun';
import { SessionCredentials } from './types';
import { ClientCredentials } from '../shared/types';
import { preseterClient } from '../shared/clientApi';

export interface PresenterAppState {
  client: Maybe<ClientCredentials>
  sessionCredentials: Maybe<SessionCredentials>
}

export class PresenterApp extends React.Component<{}, PresenterAppState> {

  constructor(props: {}) {
    super(props)

    this.state = {
      client: none(),
      sessionCredentials: none(),
    }
  }

  componentDidMount() {
    const credentials = preseterClient.loadCredentials()
    if (isSome(credentials)) {
      this.setState(s => ({...s, client: credentials}))
    } else {
      preseterClient.register()
        .then(c => this.setState(s => ({...s, client: some(c)})))
        // tslint:disable-next-line:no-console
        .catch(console.error)
    }
  }

  render() {
    return (<section>
      <h1>Presentation</h1>

      <pre>
        { isSome(this.state.client) ? JSON.stringify(this.state.client, null, 2) : 'no client credentials set'}
      </pre>
      <pre>
        { isSome(this.state.sessionCredentials) ? JSON.stringify(this.state.sessionCredentials, null, 2) : 'no session credentials set'}
      </pre>
    </section>)
  }

}
