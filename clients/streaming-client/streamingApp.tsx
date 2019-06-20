import * as React from 'react'
import { EntryScreen } from './screens/entryScreen'
import { PermissionScreen } from './screens/permissionScreen'
import { ViewfinderScreen } from './screens/viewfinderScreen'
import { Maybe, none, Some, Action, isSome, some } from '../../shared/fun';
import { PermissionState } from './types';
import { sourceClient } from '../shared/clientApi';
import { ClientCredentials } from '../shared/types';
import * as styles from './streamingApp.scss'

const appStyle = styles.app;
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
  stream: Maybe<MediaStream>
}

export type StreamingAppState = EntryScreenState | PermissionScreenState | ViewfinderScreenState

export const initialViewfinderState = (s: PermissionScreenState): ViewfinderScreenState => ({
  screen: 'viewfinder',
  sessionToken: s.sessionToken,
  credentials: s.credentials,
  availableDevices: none(),
  currentDeviceId: none(),
  stream: none(),
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
    const credentials = sourceClient.loadCredentials()
    if (isSome(credentials)) {
      this.setState(s => ({...s, credentials}))
    } else {
      sourceClient.register()
        .then(c => this.setState(s => ({...s, credentials: some(c)})))
        // tslint:disable-next-line:no-console
        .catch(console.error)
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
