import { Action } from '../../shared/fun'

export type HeadersAction = Action<HeadersInit>

type AuthenticationHeaderCredentials = { kind: 'bearer', token: string } | { kind: 'basic', user: string, password: string }

const authenticationHeaders = (c: AuthenticationHeaderCredentials): HeadersAction => h =>
  c.kind === 'bearer' ?
    { ...h, Authorization: `Bearer ${c.token}`}
  :
    { ...h, Authorization: `Basic ${btoa(`${c.user}:${c.password}`)}` }

const contentTypeHeader: (type: string) => HeadersAction = type => h => ({...h, 'Content-Type': type})

const contentJson = contentTypeHeader('application/json')

export const bearerToken = (token: string) => authenticationHeaders({ kind: 'bearer', token})

const clientVersion: (v: string) => Action<HeadersInit> = v => h => ({ ...h, 'X-Client-Version': v})

export const baseHeaders = contentJson({})

export const authenticatedHeaders = (token: string) => bearerToken(token)(baseHeaders)
