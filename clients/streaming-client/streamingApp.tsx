import * as React from 'react'
import { EntryScreen } from './entryScreen'
import { PermissionScreen } from './permissionScreen'
import { ViewfinderScreen } from './viewfinderScreen'

interface StreamingAppState {
  screen: 'entry' | 'permission' | 'viewfinder'
}

export class StreamingApp extends React.Component<{}, StreamingAppState> {

  constructor(props: {}) {
    super(props)

    this.state = {
      screen: 'entry',
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
