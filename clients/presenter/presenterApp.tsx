import * as React from 'react';
import io from 'socket.io-client';
import { SourceDTO, CandidateDTO, DescriptorDTO } from '../../shared/dto';
import { Action, isNone, isSome, Maybe, none, some } from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { bearerToken } from '../shared/headers';
import { toFormattedJSON, updateSocketStatus } from '../shared/helpers';
import { SocketException } from '../shared/socketExceptions/socketException';
import { ClientCredentials, PeerConnectionState } from '../shared/types';
import { SocketState } from '../streaming-client/types';
import { SessionCredentials } from './types';
import { UnsupportedSDPTypeException } from '../shared/socketExceptions/UnsupportedSDPTypeException';
import { capture, info } from '../shared/logger';

export interface PresenterAppState {
  credentials: Maybe<ClientCredentials>
  sessionCredentials: Maybe<SessionCredentials>
  socket: SocketState
  descriptors: Array<SourceDTO<DescriptorDTO>>
  candidates: Array<SourceDTO<CandidateDTO>>
  streams: MediaStream[]
  peerState: PeerConnectionState
}

const updatePeerState = <k extends keyof PeerConnectionState>(key: k) => (pc: RTCPeerConnection): Action<PresenterAppState>  => {
  const value = pc[key]
  info('Peerstate update for', key, value)
  return s => ({...s, peerState: {...s.peerState, [key]: value }})
}

export class PresenterApp extends React.Component<{}, PresenterAppState> {
  private authHandler: ClientAuthenticationHandler<PresenterAppState>
  private socket: SocketIOClient.Socket
  private peerConnection: RTCPeerConnection
  private video = React.createRef<HTMLVideoElement>()

  constructor(props: {}) {
    super(props)

    this.peerConnection = new RTCPeerConnection()

    this.state = {
      credentials: none(),
      sessionCredentials: none(),
      socket: 'disconnected',
      descriptors: [],
      candidates: [],
      streams: [],
      peerState: {
        connectionState: this.peerConnection.connectionState,
        iceConnectionState: this.peerConnection.iceConnectionState,
        iceGatheringState: this.peerConnection.iceGatheringState,
        signalingState: this.peerConnection.signalingState,
      },
    }

    this.updateState = this.updateState.bind(this)
    this.handleDescriptor = this.handleDescriptor.bind(this)
    this.handleCandidate = this.handleCandidate.bind(this)
    this.sendLocalDescription = this.sendLocalDescription.bind(this)
    this.sendCandidate = this.sendCandidate.bind(this)
  }

  updateState(a: Action<PresenterAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    this.authHandler = new ClientAuthenticationHandler<PresenterAppState>('presenter', this.updateState)
    this.authHandler.init().catch(capture)

    this.peerConnection.onicecandidate = this.sendCandidate
    this.peerConnection.onnegotiationneeded = async () => {
      info('negotiation needed')
      try {
        const offer = await this.peerConnection.createOffer()
        this.sendLocalDescription(offer)
      } catch (e) {
        throw e
      }
    }
    this.peerConnection.ontrack = e => {
      info('track', e)
      if (!e.streams) {
        return
      }
      if (this.video && this.video.current) {
        this.video.current.srcObject = e.streams[0]
      }
      this.setState(s => ({...s, streams: [...s.streams, ...e.streams]}))
    }
    info(this.peerConnection)
    this.peerConnection.oniceconnectionstatechange = () => this.updateState(updatePeerState('iceConnectionState')(this.peerConnection))
    this.peerConnection.onconnectionstatechange = () => this.updateState(updatePeerState('connectionState')(this.peerConnection))
    this.peerConnection.onicegatheringstatechange = () => this.updateState(updatePeerState('iceGatheringState')(this.peerConnection))
    this.peerConnection.onsignalingstatechange = () => this.updateState(updatePeerState('signalingState')(this.peerConnection))
    this.peerConnection.onstatsended = e => info('on stats ended', e)
    this.peerConnection.onicecandidateerror = e => info('on ice candidate error', e)
  }

  sendCandidate(c: RTCPeerConnectionIceEvent) {
    info('sending ice candidate')
    this.socket.emit('candidate', c.candidate)
  }

  async sendLocalDescription(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection.setLocalDescription(offer)
      this.socket.emit('descriptor', this.peerConnection.localDescription)
    } catch (e) {
      capture(e)
    }
  }

  async handleDescriptor(dto: SourceDTO<DescriptorDTO>): Promise<void> {
    if (dto.data.type !== 'offer' && dto.data.type !== 'answer') {
      throw new UnsupportedSDPTypeException(`Unsupported SDP type: ${dto.data.type}`)
    }
    info('descriptor received')
    await this.peerConnection.setRemoteDescription(dto.data)
    if (dto.data.type === 'offer') {
      const offer = await this.peerConnection.createAnswer()
      this.sendLocalDescription(offer)
    }
  }

  handleCandidate(dto: SourceDTO<CandidateDTO>): void {
    if (!dto.data) {
      return
    }
    info('candidate received')
    this.peerConnection.addIceCandidate(dto.data)
  }

  componentDidUpdate(prevProps: {}, prevState: PresenterAppState) {
    this.authHandler.onUpdate(prevState.credentials, this.state.credentials)

    if (isSome(this.state.credentials) && isSome(this.state.credentials.v.sessionToken)
    && (isNone(prevState.credentials) || isNone(prevState.credentials.v.sessionToken))) {
      const sessionId = '96a47b1d-1a91-4f55-b17f-3e82f5f757de'

      this.socket = io(`/?session=${sessionId}`, {
        transportOptions: {
          polling: {
            extraHeaders: bearerToken(this.state.credentials.v.sessionToken.v)({}),
          },
        },
      })

      this.socket.on('connect', () => this.updateState(updateSocketStatus<PresenterAppState>('connected')))
      this.socket.on('disconnect', () => this.updateState(updateSocketStatus<PresenterAppState>('disconnected')))
      this.socket.on('exception', (data: any) => { throw new SocketException(data) })
      this.socket.on('descriptor', this.handleDescriptor)
      this.socket.on('candidate', this.handleCandidate)
    }
  }

  render() {
    return (<section>
      <h1>Presentation</h1>

      <pre>
        { isSome(this.state.credentials) ? toFormattedJSON(this.state.credentials) : 'no client credentials set'}
      </pre>
      <pre>
        { toFormattedJSON(this.state.peerState)}
      </pre>

      <video autoPlay playsInline ref={this.video} />

    </section>)
  }

}
