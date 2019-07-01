import * as React from 'react';
import { JoinSessionDTO } from '../../shared/dto';
import { Action, Async, AsyncLoaded, isLoaded, isLoading, isPristine, isSome, Maybe, none, pristine, Some } from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { ClientCredentials } from '../shared/types';
import { joinSession } from './apiHandler';
import { EntryScreen } from './screens/entryScreen';
import { PermissionScreen } from './screens/permissionScreen';
import { ViewfinderScreen } from './screens/viewfinderScreen';
import * as styles from './streamingApp.scss';
import { PermissionState } from './types';

export interface EntryScreenState {
  screen: 'entry',
  sessionToken: Maybe<string>
  session: Async<JoinSessionDTO>
  credentials: Maybe<ClientCredentials>
}

export interface PermissionScreenState {
  screen: 'permission',
  session: AsyncLoaded<JoinSessionDTO>
  credentials: Some<ClientCredentials>
  permission: PermissionState
}

export interface ViewfinderScreenState {
  screen: 'viewfinder'
  session: AsyncLoaded<JoinSessionDTO>
  credentials: Some<ClientCredentials>
  availableDevices: Maybe<MediaDeviceInfo[]>
  currentDeviceId: Maybe<string>
  stream: Maybe<MediaStream>
  peerConnection: RTCPeerConnection
  socket: 'disconnected' | 'connected'
}

export type StreamingAppState = EntryScreenState | PermissionScreenState | ViewfinderScreenState

export const initialViewfinderState = (s: PermissionScreenState): ViewfinderScreenState => ({
  screen: 'viewfinder',
  credentials: s.credentials,
  session: s.session,
  availableDevices: none(),
  currentDeviceId: none(),
  stream: none(),
  peerConnection: new RTCPeerConnection(),
  socket: 'disconnected',
})

export class StreamingApp extends React.Component<{}, StreamingAppState> {
  private authHandler: ClientAuthenticationHandler<StreamingAppState>

  constructor(props: {}) {
    super(props)

    this.state = {
      screen: 'entry',
      sessionToken: none(),
      credentials: none(),
      session: pristine(),
    }

    this.updateState = this.updateState.bind(this)

    this.authHandler = new ClientAuthenticationHandler<StreamingAppState>('source', this.updateState)
  }

  updateState(a: Action<StreamingAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    // tslint:disable-next-line:no-console
    this.authHandler.init().catch(console.error)
  }

  componentDidUpdate(_: {}, prevState: StreamingAppState) {
    this.authHandler.onUpdate(prevState.credentials, this.state.credentials)

    if (isSome(this.state.credentials) && isLoading(this.state.session) && isPristine(prevState.session) && this.state.screen === 'entry') {
      joinSession(this.state).then(this.updateState)
    }

    if (isLoaded(this.state.session) && isLoading(prevState.session)) {
      this.updateState(s => s.screen === 'entry' && isSome(s.credentials) && isLoaded(s.session) ? {
        screen: 'permission',
        permission: 'loading',
        session: s.session,
        credentials: s.credentials,
      } : s)
    }
  }

  render() {
    return <div className={styles.app} >{
      this.state.screen === 'viewfinder' ?
        <ViewfinderScreen updateState={this.updateState} {...this.state} />
      : this.state.screen === 'permission' ?
        <PermissionScreen updateState={this.updateState} {...this.state} />
      : <EntryScreen updateState={this.updateState} {...this.state} />
    }</div>
  }

}
