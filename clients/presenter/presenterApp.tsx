import { Map } from 'immutable';
import * as React from 'react';
import { CandidateDTO, DescriptorDTO, SessionDTO, SourceDTO } from '../../shared/dto';
import {
  Action,
  Async,
  error,
  isError,
  isLoaded,
  isLoading,
  isNone,
  isPristine,
  isSome,
  loaded,
  loading,
  Maybe,
  none,
  pristine,
} from '../../shared/fun';
import { ClientAuthenticationHandler } from '../shared/clientAuthenticationHandler';
import { Heading } from '../shared/components/heading';
import { Highlight } from '../shared/components/highlight';
import { capture, info } from '../shared/logger';
import { PeerConnectionMissingException } from '../shared/peerConnectionMissingException';
import { sessionApi } from '../shared/sessionApi';
import { emitCandidate, emitDescriptor, openSocket, closeSocket } from '../shared/signaling';
import { UnsupportedSDPTypeException } from '../shared/socketExceptions/UnsupportedSDPTypeException';
import { ClientCredentials, PeerConnectionState } from '../shared/types';
import { LoadingPage } from '../streaming-client/screens/loadingPage';
import { SocketState } from '../streaming-client/types';
import { StreamVideo } from './components/streamVideo';
import * as styles from './presenterApp.scss';
import freeice from 'freeice';
import { updateIceServers } from '../shared/helpers';
import { Button } from '../shared/components/button';

export interface PresenterAppState {
  credentials: Maybe<ClientCredentials>
  session: Async<SessionDTO>
  iceServers: Async<RTCIceServer[]>
  socket: SocketState
  descriptors: Array<SourceDTO<DescriptorDTO>>
  candidates: Array<SourceDTO<CandidateDTO>>
  streams: Map<string, MediaStream>
  peers: Map<string, PeerConnectionState>
  overrideHost: boolean
}

export interface PresenterAppProps {
  sessionId: Maybe<string>
  sessionKey: Maybe<string>
}

const equals = <a extends { [key: string]: any }>(o0: a, o1?: a): boolean => {
  if (o1 === undefined) {
    return false
  }
  const keysA = Object.keys(o0)
  const keysB = Object.keys(o1)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.find(k => o0[k] !== o1[k]) === undefined
}

const updatePeerState = (id: string) => <k extends keyof PeerConnectionState>(key: k) => (pc: RTCPeerConnection): Action<PresenterAppState> => {
  const value = pc[key]
  return s => {
    const p = s.peers.get(id)
    if (p === undefined) {
      return s
    }
    info('Peerstate update for', id, key, p[key], '->', value)
    return  {...s, peers: s.peers.set(id, { ...p, [key]: value }) }
  }
}

export class PresenterApp extends React.Component<PresenterAppProps, PresenterAppState> {
  private authHandler: ClientAuthenticationHandler<PresenterAppState>
  private socket: SocketIOClient.Socket
  private peers: { [clientId: string]: RTCPeerConnection } = {}

  constructor(props: PresenterAppProps) {
    super(props)

    this.state = {
      credentials: none(),
      session: pristine(),
      iceServers: pristine(),
      socket: 'disconnected',
      descriptors: [],
      candidates: [],
      streams: Map(),
      peers: Map(),
      overrideHost: false,
    }

    this.updateState = this.updateState.bind(this)
    this.handleDescriptor = this.handleDescriptor.bind(this)
    this.handleCandidate = this.handleCandidate.bind(this)
    this.sendLocalDescription = this.sendLocalDescription.bind(this)
    this.sendCandidate = this.sendCandidate.bind(this)
    this.peerConnectionInit = this.peerConnectionInit.bind(this)
  }

  updateState(a: Action<PresenterAppState>, callback?: () => void) {
    this.setState(s => a(s), callback)
  }

  componentDidMount() {
    this.authHandler = new ClientAuthenticationHandler<PresenterAppState>('presenter', this.updateState)
    this.authHandler.init().catch(capture)
  }

  peerConnectionInit(clientId: string) {
    return new Promise((resolve, reject) => {
      const iceServers = isLoaded(this.state.iceServers) ? this.state.iceServers.v : []
      const pc = new RTCPeerConnection({ iceServers })
      pc.onicecandidate = this.sendCandidate(clientId)
      pc.onnegotiationneeded = async () => {
        info('negotiation needed')
        try {
          const offer = await pc.createOffer()
          this.sendLocalDescription(offer, clientId)
        } catch (e) {
          throw e
        }
      }
      pc.ontrack = e => {
        info('track', e)
        if (!e.streams) {
          return
        }
        this.setState(s => ({...s, streams: s.streams.set(clientId, e.streams[0]) }))
      }
      const ups = updatePeerState(clientId)
      pc.oniceconnectionstatechange = () => this.updateState(ups('iceConnectionState')(pc))
      pc.onconnectionstatechange = () => this.updateState(ups('connectionState')(pc))
      pc.onicegatheringstatechange = () => this.updateState(ups('iceGatheringState')(pc))
      pc.onsignalingstatechange = () => this.updateState(ups('signalingState')(pc))
      pc.onstatsended = e => info('on stats ended', e)
      pc.onicecandidateerror = e => capture(e)
      this.peers[clientId] = pc

      this.updateState(s => ({...s, peers: s.peers.set(clientId, {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState,
      }) }), () => resolve())
    })
  }

  sendCandidate(clientId: string) {
    return (c: RTCPeerConnectionIceEvent) => {
      if (c.candidate) {
        info('sending candidate')
        emitCandidate(this.socket)({ target: 'source', sourceClientId: clientId, data: c.candidate})
      }
    }
  }

  async sendLocalDescription(offer: RTCSessionDescriptionInit, sourceClientId: string): Promise<void> {
    try {
      info('sending descriptor')
      if (!this.peers[sourceClientId]) {
        throw new PeerConnectionMissingException(`Peer connection for client with id ${sourceClientId} missing`)
      }
      await this.peers[sourceClientId].setLocalDescription(offer)
      const data = this.peers[sourceClientId].localDescription
      if (data) {
        emitDescriptor(this.socket)({ target: 'source', sourceClientId, data })
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
    if (!this.peers[dto.sourceClientId]) {
      await this.peerConnectionInit(dto.sourceClientId)
    }
    await this.peers[dto.sourceClientId].setRemoteDescription(dto.data)
    if (dto.data.type === 'offer') {
      const offer = await this.peers[dto.sourceClientId].createAnswer()
      this.sendLocalDescription(offer, dto.sourceClientId)
    }
  }

  handleCandidate(dto: SourceDTO<CandidateDTO>): void {
    info('candidate received')
    if (!dto.data) {
      return
    }
    if (!this.peers[dto.sourceClientId]) {
      throw new PeerConnectionMissingException(`No peer connection found for client with id ${dto.sourceClientId}`)
    }
    this.peers[dto.sourceClientId].addIceCandidate(dto.data)
  }

  componentDidUpdate(prevProps: {}, prevState: PresenterAppState) {
    this.authHandler.onUpdate(prevState.credentials, this.state.credentials)

    if (isSome(this.state.credentials) && isNone(prevState.credentials)) {
      updateIceServers(this.updateState, this.state.credentials)
    }

    this.state.peers.filter((p, id) => !equals(p, prevState.peers.get(id)))
    .forEach((p, id) => {
      if (p.iceConnectionState === 'closed'
      || p.iceConnectionState === 'failed'
      || p.iceConnectionState === 'disconnected'
      || p.signalingState === 'closed'
      ) {
        this.closePeerConnection(id)
      }
    })

    if (isSome(this.props.sessionId) && isSome(this.props.sessionKey)
    && isSome(this.state.credentials) && isSome(this.state.credentials.v.sessionToken)
    && (isNone(prevState.credentials) || isNone(prevState.credentials.v.sessionToken))) {
      this.updateState(s => ({...s, session: loading()}))
    }

    if (isLoading(this.state.session) && !isLoading(prevState.session) && isSome(this.state.credentials)
    && isSome(this.props.sessionId) && isSome(this.props.sessionKey)) {
      sessionApi(this.state.credentials.v).hostSession(this.props.sessionId.v, this.props.sessionKey.v, this.state.overrideHost)
        .then(dto => this.updateState(s => ({...s, session: loaded(dto)})))
        .catch(e => this.updateState(s => ({...s, session: error(e.message)})))
    }

    if (isSome(this.state.credentials) && isSome(this.state.credentials.v.sessionToken)
    && isLoaded(this.state.session) && isLoading(prevState.session)) {
      this.socket = openSocket<PresenterAppState>(
        this.state.credentials.v.sessionToken,
        this.updateState,
        { session: this.state.session.v.id },
      )
      this.socket.on('descriptor', this.handleDescriptor)
      this.socket.on('candidate', this.handleCandidate)
    }
  }

  closePeerConnection(clientId: string) {
    this.peers[clientId].ontrack = null
    this.peers[clientId].onicecandidate = null
    this.peers[clientId].onnegotiationneeded = null
    this.peers[clientId].oniceconnectionstatechange = null
    this.peers[clientId].onconnectionstatechange = null
    this.peers[clientId].onicegatheringstatechange = null
    this.peers[clientId].onsignalingstatechange = null
    this.peers[clientId].onstatsended = null
    this.peers[clientId].onicecandidateerror = null

    this.peers[clientId].close()
    delete this.peers[clientId]

    const stream = this.state.streams.get(clientId)
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }

    this.updateState(s => ({...s, peers: s.peers.delete(clientId), streams: s.streams.delete(clientId) }))
  }

  componentWillUnmount() {
    Object.values(this.peers).forEach(p => p.close())
    closeSocket(this.socket, this.updateState)
  }

  render() {

    if (isNone(this.props.sessionId) || isNone(this.props.sessionKey)) {
      return (<section className={styles.container} >

        <div className={styles.background} >
          <Heading w={1} className={styles.title} >No session available</Heading>
          <Heading w={2} className={styles.subheading} >Join the fun at <a href='/live' ><Highlight>issho.app/live</Highlight></a></Heading>
        </div>

      </section>)
    }

    if (isPristine(this.state.session) || isLoading(this.state.session)) {
      return (<section className={styles.container} >

        <div className={styles.background} >
          <Heading w={1} className={styles.title} ><Highlight>Loading...</Highlight></Heading>
        </div>

      </section>)
    }

    if (isError(this.state.session) && this.state.session.m === 'Session already has host') {
      return (<section className={styles.container} >

        <div className={styles.background} >
          <Heading w={1} className={styles.title} >Session alreay being hosted</Heading>
          <Heading w={2} className={styles.subheading} >Click continue if you want to resume the session on this screen.</Heading>
          <Button label='Continue' onClick={() => this.setState(s => ({...s, session: loading(), overrideHost: true})) } />
        </div>

      </section>)
    }

    if (isError(this.state.session)) {
      return (<section className={styles.container} >

        <div className={styles.background} >
          <Heading w={1} className={styles.title} >Oops!</Heading>
          <Heading w={2} className={styles.subheading} >{this.state.session.m}</Heading>
        </div>

      </section>)
    }

    return (<section className={styles.container} >

      <div className={styles.background} >
        <Heading w={1} className={styles.title} >Use code <Highlight>{this.state.session.v.activeSession.token}</Highlight></Heading>
        <Heading w={2} className={styles.subheading} >Join at www.issho.app/live</Heading>
      </div>

      <div className={styles.videos} >
      { this.state.streams.map((s, i) => <StreamVideo key={i} stream={s} />).toArray().map(e => e[1]) }
      </div>

    </section>)
  }

}
