import * as React from 'react'
import { EntryScreen } from './entryScreen'
import { PermissionScreen } from './permissionScreen'
import { ViewfinderScreen } from './viewfinderScreen'
import { Maybe, none, Some, Action, isSome, some } from '../shared/fun';
import { PermissionState, ClientCredentials } from './types';
import { loadCredentials, registerClient } from './clientApi';

export interface EntryScreenState {
  screen: 'entry',
  sessionToken: Maybe<string>
  credentials: Maybe<ClientCredentials>
}

export interface PermissionScreenState {
  screen: 'permission',
  sessionToken: Some<string>
  credentials: Some<ClientCredentials>
  permission: PermissionState
}

export interface ViewfinderScreenState {
  screen: 'viewfinder'
  sessionToken: Some<string>
  credentials: Some<ClientCredentials>
  availableDevices: Maybe<MediaDeviceInfo[]>
  currentDeviceId: Maybe<string>
}

export type StreamingAppState = EntryScreenState | PermissionScreenState | ViewfinderScreenState

export const initialViewfinderState = (s: PermissionScreenState): ViewfinderScreenState => ({
  screen: 'viewfinder',
  sessionToken: s.sessionToken,
  credentials: s.credentials,
  availableDevices: none(),
  currentDeviceId: none(),
})
export class StreamingApp extends React.Component<{}, StreamingAppState> {

  constructor(props: {}) {
    super(props)

    this.state = {
      screen: 'entry',
      sessionToken: none(),
      credentials: none(),
    }

    this.updateState = this.updateState.bind(this)
  }

  updateState(a: Action<StreamingAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    const credentials = loadCredentials()
    if (isSome(credentials)) {
      this.setState(s => ({...s, credentials}))
    } else {
      registerClient()
        .then(c => this.setState(s => ({...s, credentials: some(c)})))
        // tslint:disable-next-line:no-console
        .catch(console.error)
    }
  }

  render() {
    return <>{
      this.state.screen === 'viewfinder' ?
        <ViewfinderScreen updateState={this.updateState} {...this.state} />
      : this.state.screen === 'permission' ?
        <PermissionScreen updateState={this.updateState} {...this.state} />
      : <EntryScreen updateState={this.updateState} {...this.state} />
    }</>
  }

}
