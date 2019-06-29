import * as React from 'react'
import { StateUpdater, ClientCredentials } from '../../shared/types';
import { StreamingAppState } from '../streamingApp';
import { isSome, none, some, Maybe, isNone, isError, Async, isPristine, loading, isLoading, unit, pristine } from '../../../shared/fun';
import { Title, Subtitle } from '../components/title';
import * as styles from './entryScreen.scss'
import { Page } from '../components/page';
import { Button } from '../components/button';
import { TokenInput } from '../components/tokenInput';
import { JoinSessionDTO } from '../../../shared/dto';

export interface EntryScreenProps {
  updateState: StateUpdater<StreamingAppState>
  sessionToken: Maybe<string>
  credentials: Maybe<ClientCredentials>
  session: Async<JoinSessionDTO>
}

const updateSessionToken = (us: StateUpdater<StreamingAppState>) => (value: string) => value === ''
  ? us(s => s.screen === 'entry' ? {...s, sessionToken: none() } : s)
  : us(s => s.screen === 'entry' ? {...s, sessionToken: some(value) } : s)

const canSubmit = (p: EntryScreenProps): boolean  =>
     isSome(p.sessionToken)
  && isPristine(p.session)
  && isSome(p.credentials)
  && isSome(p.credentials.v.sessionToken)

const submit = (p: EntryScreenProps) => p.updateState(s => {
  if (isNone(s.credentials) || isNone(s.credentials.v.sessionToken)) {
    alert('The client has not been registered with the server. Please reload and try again.')
    return s
  }
  if (!canSubmit(p)) {
    return s
  }
  if (s.screen !== 'entry') {
    return s
  }
  return {...s, session: loading()}
})

export const EntryScreen = (props: EntryScreenProps) => (<Page className={styles.container}>
  <Title>一緒にカラオケ</Title>
  <Subtitle>Karaoke Together</Subtitle>
  <p>Enter your connection code below to join:</p>
  { isError(props.session) && <p>{props.session.m}</p> }
  <TokenInput
    value={props.sessionToken}
    limit={4}
    onChange={sessionToken => props.updateState(s => s.screen === 'entry' ? {...s, sessionToken, session: pristine() } : s)} />
  { isLoading(props.session)
    ? <Button disabled onClick={unit} label='Joining...' />
    : <Button disabled={!canSubmit(props)} onClick={() => submit(props)} label='Join' />
  }
</Page>)
