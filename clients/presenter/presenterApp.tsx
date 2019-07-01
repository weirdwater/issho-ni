import * as React from 'react'
import { Maybe, none, isSome, some, Action } from '../../shared/fun';
import { SessionCredentials } from './types';
import { ClientCredentials } from '../shared/types';
import { isNone } from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { SocketState } from '../streaming-client/types';
import { bearerToken } from '../shared/headers';
import { updateSocketStatus, toFormattedJSON } from '../shared/helpers';
import { SocketException } from '../shared/socketExceptions/socketException';
import io from 'socket.io-client'

export interface PresenterAppState {
  credentials: Maybe<ClientCredentials>
  sessionCredentials: Maybe<SessionCredentials>
  socket: SocketState
  descriptors: any[]
  candidates: any[]
}

export class PresenterApp extends React.Component<{}, PresenterAppState> {
  private authHandler: ClientAuthenticationHandler<PresenterAppState>
  private socket: SocketIOClient.Socket

  constructor(props: {}) {
    super(props)

    this.state = {
      credentials: none(),
      sessionCredentials: none(),
      socket: 'disconnected',
      descriptors: [],
      candidates: [],
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

    if (isSome(this.state.credentials) && isSome(this.state.credentials.v.sessionToken)
    && (isNone(prevState.credentials) || isNone(prevState.credentials.v.sessionToken))) {
      const sessionId = '96a47b1d-1a91-4f55-b17f-3e82f5f757de'

      this.socket = io(`/?session=${sessionId}`, {
        transportOptions: {
          polling: {
            extraHeaders: bearerToken(this.state.credentials.v.sessionToken.v)({}),
          },
        },
      })

      this.socket.on('connect', () => this.updateState(updateSocketStatus<PresenterAppState>('connected')))
      this.socket.on('disconnect', () => this.updateState(updateSocketStatus<PresenterAppState>('disconnected')))
      this.socket.on('exception', (data: any) => { throw new SocketException(data) })

      this.socket.on('descriptor', (data: any) => this.setState(s => ({...s, descriptors: [...this.state.descriptors, data] })))
      this.socket.on('candidate', (data: any) => this.setState(s => ({...s, candidates: [...this.state.descriptors, data] })))
    }
  }

  render() {
    return (<section>
      <h1>Presentation</h1>

      <pre>
        { isSome(this.state.credentials) ? toFormattedJSON(this.state.credentials) : 'no client credentials set'}
      </pre>
      <pre>
        { isSome(this.state.sessionCredentials) ? toFormattedJSON(this.state.sessionCredentials) : 'no session credentials set'}
      </pre>
      <h2>{this.state.descriptors.length} Descriptors</h2>
      <pre>
        { toFormattedJSON(this.state.descriptors) }
      </pre>
      <h2>{this.state.candidates.length} Candidates</h2>
      <pre>
        { toFormattedJSON(this.state.candidates) }
      </pre>
    </section>)
  }

}
