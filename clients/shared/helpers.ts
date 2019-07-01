import { Action } from '../../shared/fun'
import { SocketState } from '../streaming-client/types'

export const updateSocketStatus = <a extends { socket: SocketState }>(socket: SocketState): Action<a> => s => ({ ...s, socket })

export const toFormattedJSON = (obj: any) => JSON.stringify(obj, null, 2)
