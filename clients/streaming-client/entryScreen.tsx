import * as React from 'react'
import { StateUpdater } from '../shared/types';
import { StreamingAppState } from './streamingApp';
import { isSome, none, some, Maybe, isNone, Some } from '../shared/fun';
import { Title, Subtitle } from './components/title';
import * as styles from './entryScreen.scss'
import { Page } from './components/page';
import { Button } from './components/button';
import { TokenInput } from './components/tokenInput';

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

export const EntryScreen = (props: EntryScreenProps) => (<Page className={styles.container}>
  <Title>一緒にカラオケ</Title>
  <Subtitle>Karaoke Together</Subtitle>
  <p>Enter your connection code below to join:</p>
  <TokenInput value={props.sessionToken} onChange={sessionToken => props.updateState(s => s.screen === 'entry' ? {...s, sessionToken } : s)} />
  <Button disabled={!canSubmit(props.sessionToken)} onClick={() => submit(props.updateState)} label='Join' />
</Page>)
