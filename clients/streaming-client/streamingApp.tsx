import * as React from 'react';
import { JoinSessionDTO } from '../../shared/dto';
import { Action, Async, AsyncLoaded, isLoaded, isLoading, isNone, isPristine, isSome, Maybe, none, pristine, Some, some } from '../../shared/fun';
import { sourceClient } from '../shared/clientApi';
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
  socket: 'disconnected',
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
      session: pristine(),
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
        .catch(e => {if (e.name === 'Unauthorized') {
          // tslint:disable-next-line:no-console
          console.error('Could not authenticate using stored credentials, re-registering client.')
          sourceClient.clearCredentials()
          this.setState(s => ({...s, credentials: none()}))
          sourceClient.register()
            .then(c => this.setState(s => ({...s, credentials: some(c)})))
            // tslint:disable-next-line:no-console
            .catch(console.error)
        }})
        // tslint:disable-next-line:no-console
        .catch(e => console.error('Could not authenticate client', e))
    }

    if (isSome(c1) && isSome(c1.v.sessionToken) && (isNone(c0) || isNone(c0.v.sessionToken))) {
      // Check if session token works
      sourceClient.getClient(c1.v).catch((e: Error) => {
        if (e.name === 'Unauthorized') {
          // tslint:disable-next-line:no-console
          console.error('Could not continue session, re-authenticating')
          return this.setState(setClientSessionToken(none()))
        }
        throw e
      })
    }

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
