import { Action } from './fun'

export type UpdateState<a> = (a: Action<a>, callback?: () => void) => void
