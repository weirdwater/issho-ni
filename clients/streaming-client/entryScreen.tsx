import * as React from 'react'
import { UpdateState } from '../shared/types';
import { StreamingAppState } from './streamingApp';
import { isSome, none, some, Maybe } from '../shared/fun';

export interface EntryScreenProps {
  updateState: UpdateState<StreamingAppState>
  sessionToken: Maybe<string>
}

const updateSessionToken = (us: UpdateState<StreamingAppState>) => (value: string) => value === ''
  ? us(s => s.screen === 'entry' ? {...s, sessionToken: none() } : s)
  : us(s => s.screen === 'entry' ? {...s, sessionToken: some(value) } : s)

export const EntryScreen = (props: EntryScreenProps) => (<main>
  <h1>Join the chorus</h1>
  <input type='text' value={isSome(props.sessionToken) ? props.sessionToken.v : ''}
    onChange={e => updateSessionToken(props.updateState)(e.target.value)} />
  <button>Join</button>
</main>)
