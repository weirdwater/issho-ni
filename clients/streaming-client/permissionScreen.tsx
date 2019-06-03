import * as React from 'react'
import { StateUpdater } from '../shared/types';
import { StreamingAppState, initialViewfinderState } from './streamingApp';
import { PermissionState } from './types';

export interface PermissionScreenProps {
  updateState: StateUpdater<StreamingAppState>
  permission: PermissionState
}

export class PermissionScreen extends React.Component<PermissionScreenProps, {}> {

  constructor(props: PermissionScreenProps) {
    super(props)

    this.updatePermissionState = this.updatePermissionState.bind(this)
  }

  updatePermissionState(p: PermissionState) {
    this.props.updateState(s => s.screen === 'permission' ? { ...s, permission: p } : s)
  }

  componentDidMount() {
    if ((navigator as any).permissions && (navigator as any).permissions.query) {
      (navigator as any).permissions
        .query({ name: 'camera' })
        .then((p: any) => {
          switch (p.state) {
            case 'granted':
              return this.updatePermissionState('granted')
            case 'prompt':
              return this.updatePermissionState('prompt')
            case 'denied':
              return this.updatePermissionState('denied')
            default:
              this.updatePermissionState('unsupported')
          }
        })
    } else {
      this.updatePermissionState('unsupported')
    }
  }

  render() {
    return (<section>
      <h1>Permissions</h1>
      <p>To join in on the fun we need your permission to access your camera.</p>
      <p>After clicking continue you will be prompted to give permission, select allow to continue.</p>
      <button onClick={() => this.props.updateState(s => s.screen === 'permission' ? initialViewfinderState(s) : s)} >Continue</button>
    </section>)
  }

}
