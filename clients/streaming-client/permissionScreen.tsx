import * as React from 'react'
import { StateUpdater } from '../shared/types';
import { StreamingAppState, initialViewfinderState } from './streamingApp';

export interface PermissionScreenProps {
  updateState: StateUpdater<StreamingAppState>
}

export const PermissionScreen = (props: PermissionScreenProps) => {

  return (<section>
    <h1>Permissions</h1>
    <p>To join in on the fun we need your permission to access your camera.</p>
    <p>After clicking continue you will be prompted to give permission, select allow to continue.</p>
    <button onClick={() => props.updateState(s => s.screen === 'permission' ? initialViewfinderState(s) : s)} >Continue</button>
  </section>)
}
