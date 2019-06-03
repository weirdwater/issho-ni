import * as React from 'react'
import { EntryScreen } from './entryScreen'
import { PermissionScreen } from './permissionScreen'
import { ViewfinderScreen } from './viewfinderScreen'
import { Maybe, none, Some, Action } from '../shared/fun';

export interface EntryScreenState {
  screen: 'entry',
  sessionToken: Maybe<string>
}

export interface PermissionScreenState {
  screen: 'permission',
  sessionToken: Some<string>
}

export interface ViewfinderScreenState {
  screen: 'viewfinder'
  sessionToken: Some<string>
}

export type StreamingAppState = EntryScreenState | PermissionScreenState | ViewfinderScreenState

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
        <ViewfinderScreen />
      : this.state.screen === 'permission' ?
        <PermissionScreen updateState={this.updateState} />
      : <EntryScreen updateState={this.updateState} sessionToken={this.state.sessionToken} />
    }</>
  }

}
