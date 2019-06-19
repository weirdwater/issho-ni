import * as React from 'react'
import { StateUpdater } from '../shared/types';
import { StreamingAppState } from './streamingApp';
import { Maybe, isSome, isNone, some, none } from '../shared/fun';
import { LoadingPage } from './loadingPage';
import * as styles from './viewfinderScreen.scss'
import { Page } from './components/page';

const constraints = (deviceId: string): MediaStreamConstraints => {
  console.log('new stream received')
  return ({
  audio: false,
  video: {
    deviceId,
  },
})}

export interface ViewfinderScreenProps {
  updateState: StateUpdater<StreamingAppState>
  availableDevices: Maybe<MediaDeviceInfo[]>
  currentDeviceId: Maybe<string>
  stream: Maybe<MediaStream>
}

const DeviceOption = (props: { device: MediaDeviceInfo}) => (
  <option value={props.device.deviceId}>
    { props.device.label || 'unlabeled device' }
  </option>
)

export class ViewfinderScreen extends React.Component<ViewfinderScreenProps, {}> {
  private video = React.createRef<HTMLVideoElement>()

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
  }

  componentDidUpdate(prevProps: ViewfinderScreenProps) {
    const video = this.video.current

    if (video && isSome(this.props.stream) && isNone(prevProps.stream)) {
      console.log('setting source')
      video.srcObject = this.props.stream.v
      video.onloadedmetadata = () => video.play()
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
        .then(stream => this.props.updateState(s => {
          console.log('new stream received')
          return s.screen === 'viewfinder' ? { ...s, stream: some(stream) } : s }))
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
        <video className={styles.video} ref={this.video} playsInline={true} ></video>
      </Page>
    )
  }
}
