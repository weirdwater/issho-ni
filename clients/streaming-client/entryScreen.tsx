import * as React from 'react'
import { StateUpdater } from '../shared/types';
import { StreamingAppState } from './streamingApp';
import { isSome, none, some, Maybe, isNone, Some } from '../shared/fun';

export interface EntryScreenProps {
  updateState: StateUpdater<StreamingAppState>
  sessionToken: Maybe<string>
}

const updateSessionToken = (us: StateUpdater<StreamingAppState>) => (value: string) => value === ''
  ? us(s => s.screen === 'entry' ? {...s, sessionToken: none() } : s)
  : us(s => s.screen === 'entry' ? {...s, sessionToken: some(value) } : s)

const canSubmit = (token: Maybe<string>): token is Some<string> => isSome(token)

const submit = (us: StateUpdater<StreamingAppState>) => us(s => {
  if (isNone(s.credentials)) {
    alert('The client has not been registered with the server. Please reload and try again.')
    return s
  }
  return canSubmit(s.sessionToken)
    ? ({...s, screen: 'permission', sessionToken: s.sessionToken, credentials: s.credentials, permission: 'loading'})
    : s
})

export const EntryScreen = (props: EntryScreenProps) => (<section>
  <h1>Join the chorus</h1>
  <input type='text' value={isSome(props.sessionToken) ? props.sessionToken.v : ''}
    onChange={e => updateSessionToken(props.updateState)(e.target.value)} />
  <button disabled={!canSubmit(props.sessionToken)} onClick={() => submit(props.updateState)} >Join</button>
</section>)
