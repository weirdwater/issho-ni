import * as React from 'react';
import { SessionDTO, CandidateDTO, SourceDTO, DescriptorDTO } from '../../../shared/dto';
import { Action, AsyncLoaded, isNone, isSome, Maybe, none, some, Some } from '../../../shared/fun';
import { capture, info } from '../../shared/logger';
import { emitCandidate, emitDescriptor, openSocket, closeSocket } from '../../shared/signaling';
import { UnsupportedSDPTypeException } from '../../shared/socketExceptions/UnsupportedSDPTypeException';
import { ClientCredentials, PeerConnectionState, StateUpdater } from '../../shared/types';
import { Page } from '../components/page';
import { StreamingAppState, ViewfinderScreenState } from '../streamingApp';
import { SocketState } from '../types';
import { LoadingPage } from './loadingPage';
import * as styles from './viewfinderScreen.scss';
import freeice from 'freeice'

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
  session: AsyncLoaded<SessionDTO>
  credentials: Some<ClientCredentials>
  peerState: Maybe<PeerConnectionState>
  lyrics: Maybe<string>
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
    this.peerConnection = new RTCPeerConnection({ iceServers: freeice() })
    this.peerConnection.onicecandidate = c => {
      if (!c.candidate) {
        return
      }
      info('sending candidate')
      emitCandidate(this.socket)({
        target: 'presenter',
        sourceClientId: this.props.credentials.v.id,
        data: c.candidate,
      })
    }
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        this.sendLocalDescription(await this.peerConnection.createOffer())
      } catch (e) {
        capture(e)
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
      if (!this.peerConnection.localDescription) {
        return
      }
      emitDescriptor(this.socket)({
        target: 'presenter',
        sourceClientId: this.props.credentials.v.id,
        data: this.peerConnection.localDescription,
      })
    } catch (e) {
      capture(e)
    }
  }

  initSocketConnection() {
    if (isSome(this.props.credentials.v.sessionToken)) {
      this.socket = openSocket<ViewfinderScreenState>(
        this.props.credentials.v.sessionToken,
        this.updateViewState,
        { session: this.props.session.v.id },
      )

      this.socket.on('descriptor', async (dto: SourceDTO<DescriptorDTO>) => {
        info('descriptor received', dto)
        if (dto.data.type !== 'offer' && dto.data.type !== 'answer') {
          throw new UnsupportedSDPTypeException(`Unsupported SDP type: ${dto.data.type}`)
        }
        await this.peerConnection.setRemoteDescription(dto.data)
        if (dto.data.type === 'offer') {
          this.sendLocalDescription(await this.peerConnection.createOffer())
        }
      })

      this.socket.on('candidate', (candidate: SourceDTO<CandidateDTO>) => {
        if (!candidate.data) {
          return
        }
        info('candidate received', candidate)
        this.peerConnection.addIceCandidate(candidate.data)
      })

      this.socket.on('lyric', (l: {sessionId: string, line: string }) => {
        if (l.line === '') {
          this.updateViewState(s => ({...s, lyrics: none()}))
        } else {
          this.updateViewState(s => ({...s, lyrics: some(l.line)}))
        }
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
    this.peerConnection.close()
    closeSocket(this.socket, this.updateViewState)
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
        { isSome(this.props.lyrics) && <div className={styles.lyrics} >
          <p>{this.props.lyrics.v}</p>
        </div> }
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
