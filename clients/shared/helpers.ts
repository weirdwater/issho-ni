import { Action, Async, Some, loading, loaded, error } from '../../shared/fun'
import { SocketState } from '../streaming-client/types'
import { ClientCredentials } from './types';
import { sessionApi } from './sessionApi';
import { capture } from './logger';

export const updateSocketStatus = <a extends { socket: SocketState }>(socket: SocketState): Action<a> => s => ({ ...s, socket })

export const toFormattedJSON = (obj: any) => JSON.stringify(obj, null, 2)

export const updateIceServers = <a extends { iceServers: Async<RTCIceServer[]> }>(su: (f: Action<a>) => void, c: Some<ClientCredentials>) => {
  su(s => ({...s, iceServers: loading()}))
  sessionApi(c.v).getIceServers()
    .then(is => su(s => ({...s, iceServers: loaded(is)})))
    .catch(e => {
      su(s => ({...s, iceServers: error(e.message)}))
      capture(e)
    })
}
