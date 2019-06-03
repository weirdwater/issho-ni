import { Action } from './fun'

export type StateUpdater<a> = (a: Action<a>, callback?: () => void) => void
