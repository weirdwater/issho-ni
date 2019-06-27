import * as React from 'react'
import { EntryScreen } from './screens/entryScreen'
import { PermissionScreen } from './screens/permissionScreen'
import { ViewfinderScreen } from './screens/viewfinderScreen'
import { Maybe, none, Some, Action, isSome, some, isNone } from '../../shared/fun';
import { PermissionState } from './types';
import { sourceClient } from '../shared/clientApi';
import { ClientCredentials } from '../shared/types';
import * as styles from './streamingApp.scss'
import io from 'socket.io-client'
import { bearerToken } from '../shared/headers';

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

const setClientSessionToken = (sessionToken: Maybe<string>): Action<StreamingAppState> => s => isNone(s.credentials) ? s :
  { ...s, credentials: some({ ...s.credentials.v, sessionToken }) }

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

    if (isNone(credentials)) {
      return sourceClient.register()
        .then(c => this.setState(s => ({...s, credentials: some(c)})))
        // tslint:disable-next-line:no-console
        .catch(console.error)
    }

    this.setState(s => ({...s, credentials}))
  }

  componentDidUpdate(_: {}, prevState: StreamingAppState) {
    const c0 = prevState.credentials
    const c1 = this.state.credentials

    if (isSome(c1) && isNone(c1.v.sessionToken) && (isNone(c0) || isSome(c0.v.sessionToken))) {
      sourceClient.authenticate(c1.v)
        .then(token => this.setState(setClientSessionToken(some(token))))
        // tslint:disable-next-line:no-console
        .catch(e => console.error('Could not authenticate client', e))
    }

    if (isSome(c1) && isSome(c1.v.sessionToken) && (isNone(c0) || isNone(c0.v.sessionToken))
    ) {
      // Check if session token works
      sourceClient.getClient(c1.v).catch((e: Error) => {
        if (e.name === 'Unauthorized') {
          // tslint:disable-next-line:no-console
          console.error('Could not continue session, re-authenticating')
          return this.setState(setClientSessionToken(none()))
        }
        throw e
      })

      // Setup socket communication
      console.log('Connecting to socket')
      const socket = io(`/`, {
        transportOptions: {
          polling: {
            extraHeaders: bearerToken(c1.v.sessionToken.v)({}),
          },
        },
        })
      socket.on('connect', () => {
        console.log('connected to socket, sending fake descriptor')
        socket.emit('descriptor', 'fakeDescriptor')
      })
      socket.on('descriptor', (data: any) => console.log('message received re: descriptor:', data))
      socket.on('exception', (data: any) => console.log('message received', data))
      socket.on('disconnect', () => console.log('disconnected from socket'))
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
