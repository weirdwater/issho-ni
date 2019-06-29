import * as React from 'react'
import { StateUpdater, ClientCredentials } from '../../shared/types';
import { StreamingAppState } from '../streamingApp';
import { Maybe, isSome, isNone, some, none, Some } from '../../../shared/fun';
import { LoadingPage } from './loadingPage';
import * as styles from './viewfinderScreen.scss'
import { Page } from '../components/page';
import { bearerToken } from '../../shared/headers';
import io from 'socket.io-client'

const constraints = (deviceId: string): MediaStreamConstraints => ({
  audio: false,
  video: {
    deviceId,
  },
})

export interface ViewfinderScreenProps {
  updateState: StateUpdater<StreamingAppState>
  availableDevices: Maybe<MediaDeviceInfo[]>
  currentDeviceId: Maybe<string>
  stream: Maybe<MediaStream>
  socket: 'connected' | 'disconnected'
  credentials: Some<ClientCredentials>
}

const DeviceOption = (props: { device: MediaDeviceInfo}) => (
  <option value={props.device.deviceId}>
    { props.device.label || 'unlabeled device' }
  </option>
)

export class ViewfinderScreen extends React.Component<ViewfinderScreenProps, {}> {
  private video = React.createRef<HTMLVideoElement>()
  private socket: SocketIOClient.Socket;

  componentDidMount() {
    navigator.mediaDevices.enumerateDevices()
      .then(ds => ds.filter(d => d.kind === 'videoinput'))
      .then(ds => {
        this.props.updateState(s => s.screen === 'viewfinder' ? {
          ...s,
          availableDevices: some(ds),
          currentDeviceId: ds.length ? some(ds[0].deviceId) : none(),
        } : s)
      })

    if (isSome(this.props.credentials.v.sessionToken)) {
      this.socket = io(`/`, {
        transportOptions: {
          polling: {
            extraHeaders: bearerToken(this.props.credentials.v.sessionToken.v)({}),
          },
        },
      })

      this.socket.on('connect', () => {
        this.props.updateState(s => s.screen === 'viewfinder' ? { ...s, socket: 'connected' } : s)
      })
      // tslint:disable-next-line:no-console
      this.socket.on('exception', (data: any) => console.error('Exception received', data))
      // tslint:disable-next-line:no-console
      this.socket.on('disconnect', () => {
        this.props.updateState(s => s.screen === 'viewfinder' ? { ...s, socket: 'disconnected' } : s)
      })
    }
  }

  componentWillUnmount() {
    this.socket.close()
    this.props.updateState(s => s.screen === 'viewfinder' ? { ...s, socket: 'disconnected' } : s)
  }

  componentDidUpdate(prevProps: ViewfinderScreenProps) {
    const video = this.video.current

    if (video && isSome(this.props.stream) && isNone(prevProps.stream)) {
      video.srcObject = this.props.stream.v
    }

    if (isNone(this.props.currentDeviceId)) {
      return
    }

    if (isNone(prevProps.currentDeviceId) || this.props.currentDeviceId.v !== prevProps.currentDeviceId.v) {
      if (isSome(this.props.stream)) {
        this.props.stream.v.getTracks().forEach(t => t.stop())
        this.props.updateState(s => s.screen === 'viewfinder' ? { ...s, stream: none() } : s)
      }
      navigator.mediaDevices.getUserMedia(constraints(this.props.currentDeviceId.v))
        .then(stream => this.props.updateState(s => s.screen === 'viewfinder' ? { ...s, stream: some(stream) } : s))
    }
  }

  render() {

    if (isNone(this.props.availableDevices) || isNone(this.props.currentDeviceId) || isNone(this.props.stream)) {
      return <LoadingPage />
    }

    return (
      <Page className={styles.container} >
        <select value={isSome(this.props.currentDeviceId) ? this.props.currentDeviceId.v : undefined}
          className={styles.cameraSelector}
          onChange={e => {
            e.persist()
            this.props.updateState(s => s.screen === 'viewfinder' ? {...s, currentDeviceId: some(e.target.value)} : s)
          } } >
          { this.props.availableDevices.v.map((d, i) => <DeviceOption key={i} device={d} />) }
        </select>
        <video className={styles.video} ref={this.video} playsInline autoPlay ></video>
      </Page>
    )
  }
}
