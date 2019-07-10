import * as React from 'react';
import { SessionDTO } from '../../shared/dto';
import {
  Action,
  Async,
  AsyncLoaded,
  isLoaded,
  isLoading,
  isPristine,
  isSome,
  Maybe,
  none,
  pristine,
  Some,
  isNone,
  loading,
  loaded,
} from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { ClientCredentials, PeerConnectionState } from '../shared/types';
import { joinSession } from './apiHandler';
import { EntryScreen } from './screens/entryScreen';
import { PermissionScreen } from './screens/permissionScreen';
import { ViewfinderScreen } from './screens/viewfinderScreen';
import { PermissionState } from './types';
import { capture } from '../shared/logger';
import { sessionApi } from '../shared/sessionApi';
import { updateIceServers } from '../shared/helpers';

export interface EntryScreenState {
  screen: 'entry',
  sessionToken: Maybe<string>
  session: Async<SessionDTO>
  credentials: Maybe<ClientCredentials>
  iceServers: Async<RTCIceServer[]>
}

export interface PermissionScreenState {
  screen: 'permission',
  session: AsyncLoaded<SessionDTO>
  credentials: Some<ClientCredentials>
  permission: PermissionState
  iceServers: AsyncLoaded<RTCIceServer[]>
}

export interface ViewfinderScreenState {
  screen: 'viewfinder'
  session: AsyncLoaded<SessionDTO>
  iceServers: AsyncLoaded<RTCIceServer[]>
  credentials: Some<ClientCredentials>
  availableDevices: Maybe<MediaDeviceInfo[]>
  currentDeviceId: Maybe<string>
  stream: Maybe<MediaStream>
  peerState: Maybe<PeerConnectionState>
  socket: 'disconnected' | 'connected'
}

export type StreamingAppState = EntryScreenState | PermissionScreenState | ViewfinderScreenState

export const initialViewfinderState = (s: PermissionScreenState): ViewfinderScreenState => ({
  screen: 'viewfinder',
  credentials: s.credentials,
  session: s.session,
  iceServers: s.iceServers,
  availableDevices: none(),
  currentDeviceId: none(),
  stream: none(),
  peerState: none(),
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
      iceServers: pristine(),
    }

    this.updateState = this.updateState.bind(this)

    this.authHandler = new ClientAuthenticationHandler<StreamingAppState>('source', this.updateState)
  }

  updateState(a: Action<StreamingAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    this.authHandler.init().catch(capture)
  }

  componentDidUpdate(_: {}, prevState: StreamingAppState) {
    this.authHandler.onUpdate(prevState.credentials, this.state.credentials)

    if (isSome(this.state.credentials) && isLoading(this.state.session) && isPristine(prevState.session) && this.state.screen === 'entry') {
      joinSession(this.state).then(this.updateState)
    }

    if (isSome(this.state.credentials) && isNone(prevState.credentials)) {
      updateIceServers(this.updateState, this.state.credentials)
    }

    if (isLoaded(this.state.session) && isLoading(prevState.session)) {
      this.updateState(s => s.screen === 'entry' && isSome(s.credentials) && isLoaded(s.session) && isLoaded(s.iceServers) ? {
        screen: 'permission',
        permission: 'loading',
        session: s.session,
        iceServers: s.iceServers,
        credentials: s.credentials,
      } : s)
    }
  }

  render() {
    return <div>{
      this.state.screen === 'viewfinder' ?
        <ViewfinderScreen updateState={this.updateState} {...this.state} />
      : this.state.screen === 'permission' ?
        <PermissionScreen updateState={this.updateState} {...this.state} />
      : <EntryScreen updateState={this.updateState} {...this.state} />
    }</div>
  }

}
