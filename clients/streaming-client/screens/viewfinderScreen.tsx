import * as React from 'react';
import { JoinSessionDTO } from '../../../shared/dto';
import { Action, AsyncLoaded, isNone, isSome, Maybe, none, some, Some } from '../../../shared/fun';
import { capture, info } from '../../shared/logger';
import { signalingSocket } from '../../shared/signaling';
import { UnsupportedSDPTypeException } from '../../shared/socketExceptions/UnsupportedSDPTypeException';
import { ClientCredentials, PeerConnectionState, StateUpdater } from '../../shared/types';
import { Page } from '../components/page';
import { StreamingAppState, ViewfinderScreenState } from '../streamingApp';
import { SocketState } from '../types';
import { LoadingPage } from './loadingPage';
import * as styles from './viewfinderScreen.scss';

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
  socket: SocketState
  session: AsyncLoaded<JoinSessionDTO>
  credentials: Some<ClientCredentials>
  peerState: Maybe<PeerConnectionState>
}

const DeviceOption = (props: { device: MediaDeviceInfo}) => (
  <option value={props.device.deviceId}>
    { props.device.label || 'unlabeled device' }
  </option>
)

const updatePeerState = <k extends keyof PeerConnectionState>(key: k) => (pc: RTCPeerConnection): Action<ViewfinderScreenState> => {
  const value = pc[key]
  return s => {
    if (isNone(s.peerState)) {
      return s
    }
    info('Peerstate update for', key, s.peerState.v[key], '->', value)
    return  {...s, peerState: some({...s.peerState.v, [key]: value })}
  }
}

const mapToViewState = (a: Action<ViewfinderScreenState>) => (s: StreamingAppState) => s.screen === 'viewfinder' ? a(s) : s

export class ViewfinderScreen extends React.Component<ViewfinderScreenProps, {}> {
  private video = React.createRef<HTMLVideoElement>()
  private socket: SocketIOClient.Socket
  private peerConnection: RTCPeerConnection

  constructor(props: ViewfinderScreenProps) {
    super(props)

    this.initPeerconnection = this.initPeerconnection.bind(this)
    this.initSocketConnection = this.initSocketConnection.bind(this)
    this.sendLocalDescription = this.sendLocalDescription.bind(this)
    this.updateViewState = this.updateViewState.bind(this)
  }

  updateViewState(a: Action<ViewfinderScreenState>) {
    this.props.updateState(mapToViewState(a))
  }

  initPeerconnection() {
    this.peerConnection = new RTCPeerConnection()
    this.peerConnection.onicecandidate = c => {
      info('sending candidate')
      this.socket.emit('candidate', c.candidate)
    }
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        this.sendLocalDescription(await this.peerConnection.createOffer())
      } catch (e) {
        throw e
      }
    }
    this.updateViewState(s => ({...s, peerState: some({
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      iceGatheringState: this.peerConnection.iceGatheringState,
      signalingState: this.peerConnection.signalingState,
    }) }))
    this.peerConnection.oniceconnectionstatechange = () => this.updateViewState(updatePeerState('iceConnectionState')(this.peerConnection))
    this.peerConnection.onconnectionstatechange = () => this.updateViewState(updatePeerState('connectionState')(this.peerConnection))
    this.peerConnection.onicegatheringstatechange = () => this.updateViewState(updatePeerState('iceGatheringState')(this.peerConnection))
    this.peerConnection.onsignalingstatechange = () => this.updateViewState(updatePeerState('signalingState')(this.peerConnection))
  }

  async sendLocalDescription(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      info('sending descriptor')
      await this.peerConnection.setLocalDescription(offer).catch(capture)
      this.socket.emit('descriptor', this.peerConnection.localDescription)
    } catch (e) {
      capture(e)
    }
  }

  initSocketConnection() {
    if (isSome(this.props.credentials.v.sessionToken)) {
      this.socket = signalingSocket<ViewfinderScreenState>(this.props.credentials.v, this.props.session.v.id, this.updateViewState)

      this.socket.on('descriptor', async (description: RTCSessionDescription) => {
        info('descriptor received', description)
        if (description.type !== 'offer' && description.type !== 'answer') {
          throw new UnsupportedSDPTypeException(`Unsupported SDP type: ${description.type}`)
        }
        await this.peerConnection.setRemoteDescription(description)
        if (description.type === 'offer') {
          this.sendLocalDescription(await this.peerConnection.createOffer())
        }
      })

      this.socket.on('candidate', (candidate: RTCIceCandidate) => {
        if (!candidate) {
          return
        }
        info('candidate received', candidate)
        this.peerConnection.addIceCandidate(candidate)
      })
    }
  }

  componentDidMount() {
    navigator.mediaDevices.enumerateDevices()
    .then(ds => ds.filter(d => d.kind === 'videoinput'))
    .then(ds => this.updateViewState(s => ({
        ...s,
        availableDevices: some(ds),
        currentDeviceId: ds.length ? some(ds[0].deviceId) : none(),
      })))

    this.initSocketConnection()
  }

  componentWillUnmount() {
    this.socket.close()
    this.peerConnection.close()
    this.updateViewState(s => ({ ...s, socket: 'disconnected' }))
  }

  componentDidUpdate(prevProps: ViewfinderScreenProps) {
    const video = this.video.current

    if (video && isSome(this.props.stream) && isNone(prevProps.stream)) {
      video.srcObject = this.props.stream.v
      this.initPeerconnection()
    }

    const noTracksAdded = this.peerConnection && this.peerConnection.getSenders().length === 0
    if (noTracksAdded && isSome(this.props.stream) && isSome(this.props.peerState) && this.props.peerState.v.signalingState === 'stable'
    && (isNone(prevProps.stream) || (isNone(prevProps.peerState) || isSome(prevProps.peerState) && prevProps.peerState.v.signalingState !== 'stable')
    )) {
      info('Ready to add tracks')
      const stream = this.props.stream.v
      this.props.stream.v.getVideoTracks().forEach(t => this.peerConnection.addTrack(t, stream))
    }

    if (isNone(this.props.currentDeviceId)) {
      return
    }

    if (isNone(prevProps.currentDeviceId) || this.props.currentDeviceId.v !== prevProps.currentDeviceId.v) {
      if (isSome(this.props.stream)) {
        this.props.stream.v.getTracks().forEach(t => t.stop())
        this.updateViewState(s => ({ ...s, stream: none() }))
      }
      navigator.mediaDevices.getUserMedia(constraints(this.props.currentDeviceId.v))
        .then(stream => this.props.updateState(s => ({ ...s, stream: some(stream) })))
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
            this.updateViewState(s => ({...s, currentDeviceId: some(e.target.value)}))
          } } >
          { this.props.availableDevices.v.map((d, i) => <DeviceOption key={i} device={d} />) }
        </select>
        <video className={styles.video} ref={this.video} playsInline autoPlay ></video>
      </Page>
    )
  }
}
