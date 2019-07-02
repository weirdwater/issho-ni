import * as React from 'react';
import io from 'socket.io-client';
import { SourceDTO, CandidateDTO, DescriptorDTO } from '../../shared/dto';
import { Action, isNone, isSome, Maybe, none, some } from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { bearerToken } from '../shared/headers';
import { toFormattedJSON, updateSocketStatus } from '../shared/helpers';
import { SocketException } from '../shared/socketExceptions/socketException';
import { ClientCredentials } from '../shared/types';
import { SocketState } from '../streaming-client/types';
import { SessionCredentials } from './types';
import { UnsupportedSDPTypeException } from '../shared/socketExceptions/UnsupportedSDPTypeException';

export interface PresenterAppState {
  credentials: Maybe<ClientCredentials>
  sessionCredentials: Maybe<SessionCredentials>
  socket: SocketState
  descriptors: Array<SourceDTO<DescriptorDTO>>
  candidates: Array<SourceDTO<CandidateDTO>>
  streams: MediaStream[]
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
    }

    this.updateState = this.updateState.bind(this)
    this.handleDescriptor = this.handleDescriptor.bind(this)
    this.handleCandidate = this.handleCandidate.bind(this)
    this.sendLocalDescription = this.sendLocalDescription.bind(this)
    this.sendCandidate = this.sendCandidate.bind(this)

    this.authHandler = new ClientAuthenticationHandler<PresenterAppState>('presenter', this.updateState)
  }

  updateState(a: Action<PresenterAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    // tslint:disable-next-line:no-console
    this.authHandler.init().catch(console.log)

    this.peerConnection = new RTCPeerConnection()
    this.peerConnection.onicecandidate = this.sendCandidate
    this.peerConnection.onnegotiationneeded = async () => {
      console.info('negotiation needed')
      try {
        const offer = await this.peerConnection.createOffer()
        this.sendLocalDescription(offer)
      } catch (e) {
        throw e
      }
    }
    this.peerConnection.ontrack = e => {
      console.log('track',e)
      if (!e.streams) {
        return
      }
      if (this.video && this.video.current) {
        this.video.current.srcObject = e.streams[0]
      }
      this.setState(s => ({...s, streams: [...s.streams, ...e.streams]}))
    }
  }

  sendCandidate(c: RTCPeerConnectionIceEvent) {
    console.info('sending ice candidate')
    this.socket.emit('candidate', c.candidate)
  }

  async sendLocalDescription(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection.setLocalDescription(offer)
      this.socket.emit('descriptor', this.peerConnection.localDescription)
    } catch (e) {
      console.error(e)
    }
  }

  async handleDescriptor(dto: SourceDTO<DescriptorDTO>): Promise<void> {
    if (dto.data.type !== 'offer' && dto.data.type !== 'answer') {
      throw new UnsupportedSDPTypeException(`Unsupported SDP type: ${dto.data.type}`)
    }
    console.info('descriptor received')
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
    console.info('candidate received')
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
        { isSome(this.state.sessionCredentials) ? toFormattedJSON(this.state.sessionCredentials) : 'no session credentials set'}
      </pre>

      <video autoPlay playsInline ref={this.video} />

    </section>)
  }

}
