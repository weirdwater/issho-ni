import * as React from 'react'
import { StateUpdater } from '../shared/types';
import { StreamingAppState } from './streamingApp';
import { Maybe, isSome, isNone, some, none } from '../shared/fun';
import { Loading } from './loading';

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

  componentDidUpdate() {
    if (isNone(this.props.currentDeviceId)) {
      return
    }

    navigator.mediaDevices.getUserMedia(constraints(this.props.currentDeviceId.v))
      .then(stream => {
        if (this.video.current) {
          const video = this.video.current
          video.srcObject = stream
          video.onloadedmetadata = () => video.play()
        }
      })
  }

  render() {

    if (isNone(this.props.availableDevices) || isNone(this.props.currentDeviceId)) {
      return <Loading />
    }

    return (
      <section>
        <select value={isSome(this.props.currentDeviceId) ? this.props.currentDeviceId.v : undefined}
          onChange={e => {
            e.persist()
            this.props.updateState(s => s.screen === 'viewfinder' ? {...s, currentDeviceId: some(e.target.value)} : s)
          } } >
          { this.props.availableDevices.v.map((d, i) => <DeviceOption key={i} device={d} />) }
        </select>
        <video ref={this.video} ></video>
      </section>
    )
  }
}
