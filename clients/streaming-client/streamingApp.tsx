import * as React from 'react'
import { EntryScreen } from './entryScreen'
import { PermissionScreen } from './permissionScreen'
import { ViewfinderScreen } from './viewfinderScreen'
import { Maybe, none } from '../shared/fun';

interface StreamingAppState {
  screen: 'entry' | 'permission' | 'viewfinder',
  sessionToken: Maybe<string>
}

export class StreamingApp extends React.Component<{}, StreamingAppState> {

  constructor(props: {}) {
    super(props)

    this.state = {
      screen: 'entry',
      sessionToken: none(),
    }
  }

  render() {
    return <>{
      this.state.screen === 'viewfinder' ?
        <ViewfinderScreen />
      : this.state.screen === 'permission' ?
        <PermissionScreen />
      : <EntryScreen />
    }</>
  }

}
