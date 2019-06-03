import * as React from 'react'
import { EntryScreen } from './entryScreen'
import { PermissionScreen } from './permissionScreen'
import { ViewfinderScreen } from './viewfinderScreen'
import { Maybe, none, Some, Action } from '../shared/fun';
import { PermissionState } from './types';

export interface EntryScreenState {
  screen: 'entry',
  sessionToken: Maybe<string>
}

export interface PermissionScreenState {
  screen: 'permission',
  sessionToken: Some<string>
  permission: PermissionState
}

export interface ViewfinderScreenState {
  screen: 'viewfinder'
  sessionToken: Some<string>
  availableDevices: Maybe<MediaDeviceInfo[]>
  currentDeviceId: Maybe<string>
}

export type StreamingAppState = EntryScreenState | PermissionScreenState | ViewfinderScreenState

export const initialViewfinderState = (s: PermissionScreenState): ViewfinderScreenState => ({
  screen: 'viewfinder',
  sessionToken: s.sessionToken,
  availableDevices: none(),
  currentDeviceId: none(),
})
export class StreamingApp extends React.Component<{}, StreamingAppState> {

  constructor(props: {}) {
    super(props)

    this.state = {
      screen: 'entry',
      sessionToken: none(),
    }

    this.updateState = this.updateState.bind(this)
  }

  updateState(a: Action<StreamingAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
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
