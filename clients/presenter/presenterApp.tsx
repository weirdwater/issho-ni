import * as React from 'react';
import { CandidateDTO, DescriptorDTO, SourceDTO } from '../../shared/dto';
import { Action, isNone, isSome, Maybe, none, some } from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { toFormattedJSON } from '../shared/helpers';
import { capture, info } from '../shared/logger';
import { emitCandidate, emitDescriptor, signalingSocket } from '../shared/signaling';
import { UnsupportedSDPTypeException } from '../shared/socketExceptions/UnsupportedSDPTypeException';
import { ClientCredentials, PeerConnectionState } from '../shared/types';
import { SocketState } from '../streaming-client/types';
import { SessionCredentials } from './types';

export interface PresenterAppState {
  credentials: Maybe<ClientCredentials>
  sessionCredentials: Maybe<SessionCredentials>
  socket: SocketState
  descriptors: Array<SourceDTO<DescriptorDTO>>
  candidates: Array<SourceDTO<CandidateDTO>>
  streams: MediaStream[]
  peerState: Maybe<PeerConnectionState>
}

const updatePeerState = <k extends keyof PeerConnectionState>(key: k) => (pc: RTCPeerConnection): Action<PresenterAppState> => {
  const value = pc[key]
  return s => {
    if (isNone(s.peerState)) {
      return s
    }
    info('Peerstate update for', key, s.peerState.v[key], '->', value)
    return  {...s, peerState: some({...s.peerState.v, [key]: value })}
  }
}

export class PresenterApp extends React.Component<{}, PresenterAppState> {
  private authHandler: ClientAuthenticationHandler<PresenterAppState>
  private socket: SocketIOClient.Socket
  private peerConnection: RTCPeerConnection
  private video = React.createRef<HTMLVideoElement>()

  constructor(props: {}) {
    super(props)

    this.state = {
      credentials: none(),
      sessionCredentials: none(),
      socket: 'disconnected',
      descriptors: [],
      candidates: [],
      streams: [],
      peerState: none(),
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

    this.peerConnection = new RTCPeerConnection()
    this.peerConnection.onicecandidate = this.sendCandidate
    this.peerConnection.onnegotiationneeded = async () => {
      info('negotiation needed')
      try {
        const offer = await this.peerConnection.createOffer()
        this.sendLocalDescription(offer, '4eb9c7a1-f72a-48ff-afa0-432ceaf66b41')
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
    this.peerConnection.oniceconnectionstatechange = () => this.updateState(updatePeerState('iceConnectionState')(this.peerConnection))
    this.peerConnection.onconnectionstatechange = () => this.updateState(updatePeerState('connectionState')(this.peerConnection))
    this.peerConnection.onicegatheringstatechange = () => this.updateState(updatePeerState('iceGatheringState')(this.peerConnection))
    this.peerConnection.onsignalingstatechange = () => this.updateState(updatePeerState('signalingState')(this.peerConnection))
    this.peerConnection.onstatsended = e => info('on stats ended', e)
    this.peerConnection.onicecandidateerror = e => capture(e)
    this.updateState(s => ({...s, peerState: some({
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      iceGatheringState: this.peerConnection.iceGatheringState,
      signalingState: this.peerConnection.signalingState,
    }) }))
  }

  sendCandidate(c: RTCPeerConnectionIceEvent) {
    if (c.candidate) {
      info('sending candidate')
      emitCandidate(this.socket)({ target: 'source', sourceClientId: '4eb9c7a1-f72a-48ff-afa0-432ceaf66b41', data: c.candidate})
    }
  }

  async sendLocalDescription(offer: RTCSessionDescriptionInit, sourceClientId: string): Promise<void> {
    try {
      info('sending descriptor')
      await this.peerConnection.setLocalDescription(offer)
      if (this.peerConnection.localDescription) {
        emitDescriptor(this.socket)({ target: 'source', data: this.peerConnection.localDescription, sourceClientId })
      }
    } catch (e) {
      capture(e)
    }
  }

  async handleDescriptor(dto: SourceDTO<DescriptorDTO>): Promise<void> {
    info('descriptor received')
    if (dto.data.type !== 'offer' && dto.data.type !== 'answer') {
      throw new UnsupportedSDPTypeException(`Unsupported SDP type: ${dto.data.type}`)
    }
    await this.peerConnection.setRemoteDescription(dto.data)
    if (dto.data.type === 'offer') {
      const offer = await this.peerConnection.createAnswer()
      this.sendLocalDescription(offer, dto.sourceClientId)
    }
  }

  handleCandidate(dto: SourceDTO<CandidateDTO>): void {
    info('candidate received')
    if (!dto.data) {
      return
    }
    this.peerConnection.addIceCandidate(dto.data)
  }

  componentDidUpdate(prevProps: {}, prevState: PresenterAppState) {
    this.authHandler.onUpdate(prevState.credentials, this.state.credentials)

    if (isSome(this.state.credentials) && isSome(this.state.credentials.v.sessionToken)
    && (isNone(prevState.credentials) || isNone(prevState.credentials.v.sessionToken))) {
      const sessionId = '96a47b1d-1a91-4f55-b17f-3e82f5f757de'

      this.socket = signalingSocket<PresenterAppState>(this.state.credentials.v, sessionId, this.updateState)
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
