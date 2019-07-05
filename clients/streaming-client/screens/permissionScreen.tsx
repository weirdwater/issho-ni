import * as React from 'react'
import { StateUpdater } from '../../shared/types';
import { StreamingAppState, initialViewfinderState } from '../streamingApp';
import { PermissionState } from '../types';
import { LoadingPage } from './loadingPage';
import { Page } from '../components/page';
import { Heading } from '../../shared/components/heading';
import { Button } from '../../shared/components/button';
import { capture } from '../../shared/logger';

export interface PermissionScreenProps {
  updateState: StateUpdater<StreamingAppState>
  permission: PermissionState
}

export class PermissionScreen extends React.Component<PermissionScreenProps, {}> {

  constructor(props: PermissionScreenProps) {
    super(props)

    this.updatePermissionState = this.updatePermissionState.bind(this)
    this.attemptVideoStream = this.attemptVideoStream.bind(this)
  }

  updatePermissionState(p: PermissionState) {
    this.props.updateState(s => s.screen === 'permission' ? { ...s, permission: p } : s)
  }

  attemptVideoStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          this.updatePermissionState('granted')
          stream.getTracks().forEach(t => t.stop())
        })
        .catch(e => this.updatePermissionState('denied'))
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
        .catch((e: any) => {
          capture(e)
          this.updatePermissionState('unsupported')
        })
    } else {
      this.updatePermissionState('unsupported')
    }
  }

  componentDidUpdate() {
    if (this.props.permission === 'granted') {
      this.props.updateState(s => s.screen === 'permission' ? initialViewfinderState(s) : s)
    }
  }

  render() {
    if (this.props.permission === 'loading') {
      return <LoadingPage />
    }

    if (this.props.permission === 'denied') {
      return (<Page>
        <Heading>Permissions</Heading>
        <p>For Issho Ni to work we need access to your camera.</p>
        <p>You have set your browser's permissions to deny access to the camera.
          If you wish to continue, grant Issho Ni access to your camera and reload this page.</p>
      </Page>)
    }

    return (<Page>
      <Heading>Permissions</Heading>
      <p>For Issho Ni to work we need access to your camera.</p>
      <p>You may get a prompt on the next screen, choose "allow" to continue using Issho Ni.</p>
      { this.props.permission === 'unsupported' && <p>We were unable to detect
        your camera permissions. If you do not get a prompt and the camera does
        not turn on, please grant Issho Ni access through your browser's settings.</p>
      }
      <Button onClick={this.attemptVideoStream} label='Continue' />
    </Page>)
  }

}
