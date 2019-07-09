import * as React from 'react'
import { Heading } from '../shared/components/heading'
import { info, capture } from '../shared/logger'
import {
  Async,
  Maybe,
  none,
  pristine,
  isPristine,
  isNone,
  loading,
  loaded,
  error,
  Action,
  isError,
  isSome,
  AsyncLoaded,
  isLoaded,
  isLoading,
} from '../../shared/fun'
import { Input } from './components/input';
import * as auth from './authenticationApi';
import { SelfUserDTO, SessionDTO, UsersSessionDTO } from '../../shared/dto';
import { sessionApi } from './sessionApi';
import { toFormattedJSON } from '../shared/helpers';

export interface LoginState {
  screen: 'login'
  email: Maybe<string>
  password: Maybe<string>
  sessionToken: Async<string>
  user: Async<SelfUserDTO>
}

export interface SessionScreenState {
  screen: 'sessions',
  sessionToken: AsyncLoaded<string>,
  user: AsyncLoaded<SelfUserDTO>,
  sessions: Async<UsersSessionDTO[]>
}

export interface SongsScreenState {
  screen: 'songs',
  sessionToken: AsyncLoaded<string>
  user: AsyncLoaded<SelfUserDTO>,
}

export type DashboardAppState = LoginState | SessionScreenState | SongsScreenState

// tslint:disable-next-line:no-empty-interface
export interface DashboardAppProps {

}

const updateLoginField = (a: Action<LoginState>): Action<DashboardAppState> =>
  s => s.screen === 'login' && (isPristine(s.sessionToken) || isError(s.sessionToken)) ? { ...a(s), sessionToken: pristine() } : s

export class DashboardApp extends React.Component<DashboardAppProps, DashboardAppState> {

  constructor(props: DashboardAppProps) {
    super(props)
    this.state = {
      screen: 'login',
      password: none(),
      email: none(),
      sessionToken: loading(),
      user: pristine(),
    }
    this.submitLogin = this.submitLogin.bind(this)
  }

  componentDidMount() {
    const token = auth.loadSessionToken()
    if (isSome(token)) {
      this.setState(s => ({...s, sessionToken: loaded(token.v)}))
    } else {
      this.setState(s => ({...s, sessionToken: pristine()}))
    }
  }

  submitLogin() {
    if (this.state.screen !== 'login' || isNone(this.state.email) || isNone(this.state.password) || !isPristine(this.state.sessionToken)) {
      return
    }
    this.setState(s => ({...s, sessionToken: loading()}))
    auth.authenticateUser(this.state.email.v, this.state.password.v)
      .then(token => {
        this.setState(s => ({...s, sessionToken: loaded(token)}))
      })
      .catch(e => {
        capture(e)
        this.setState(s => ({...s, sessionToken: error(e.message)}))
      })
  }

  componentDidUpdate(_: DashboardAppProps, prevState: DashboardAppState) {
    if (this.state.screen === 'login' && isLoaded(this.state.sessionToken) && !isLoaded(prevState.sessionToken)) {
      this.setState(s => ({...s, user: loading()}))
      auth.getSelf(this.state.sessionToken.v)
        .then(u => this.setState(s => ({...s, user: loaded(u)})))
        .catch(e => {
           auth.clearSessionToken()
           this.setState(s => ({
             ...s,
             sessionToken: error('Unable to resume session, please try logging in again.'),
             user: error('Unable to resume session, please try logging in again.'),
            }))
        })
    }

    if (this.state.screen === 'login' && isLoaded(this.state.sessionToken) && isLoaded(this.state.user) && !isLoaded(prevState.user)) {
      this.setState(s => ({...s, screen: 'sessions', sessions: pristine() }))
    }

    if (this.state.screen === 'sessions' && prevState.screen !== 'sessions') {
      this.setState(s => ({...s, sessions: loading()}))
      sessionApi(this.state.sessionToken.v, this.state.user.v).getAll()
        .then(sessions => {
          this.setState(s => ({...s, sessions: loaded(sessions)}))
        })
        .catch(e => {
          this.setState(s => ({...s, sessions: error(e.message)}))
          capture(e)
        })
    }
  }

  render() {

    if (this.state.screen === 'login') {
      return (
        <form onSubmit={this.submitLogin} >
          <Heading>Issho Ni</Heading>
          <p>{ isError(this.state.sessionToken) && this.state.sessionToken.m }</p>
          <label htmlFor='email' >Email</label>
          <Input type='email' id='email' value={this.state.email} autoComplete='username'
                 onValue={email => this.setState(updateLoginField(s => ({...s, email})))} />
          <label htmlFor='password' >Password</label>
          <Input type='password' id='password' value={this.state.password}  autoComplete='current-password'
                 onValue={password => this.setState(updateLoginField(s => ({...s, password})))} />
          <button
            disabled={!isPristine(this.state.sessionToken) || isNone(this.state.email) || isNone(this.state.password)}
            onClick={this.submitLogin}
          >Sign In</button>
        </form>
      )
    }

    return (<div>
      <nav>
        <Heading>Issho Ni</Heading>
        <ul>
          <li>Sessions</li>
          <li>Songs</li>
        </ul>
        <button onClick={() => info('would sign out if implemented')} >Sign Out</button>
      </nav>
      { this.state.screen === 'sessions' ? <main>
        <Heading>
          Sessions
        </Heading>
        { isPristine(this.state.sessions) ?
        <p>Initializing</p>
        : isLoading(this.state.sessions) ?
        <p>Loading...</p>
        : isError(this.state.sessions) ?
        <p>Oops: {this.state.sessions.m}</p>
        :
        <ul>
          { this.state.sessions.v.map(session => <li>
            <span>{session.title}</span>
            { session.activeSession && <a href={`/present?session=${session.id}&key=${session.key}`} >presenter</a> }
          </li>) }
        </ul>}
      </main> : <main>
        <Heading>Songs</Heading>
      </main>}
    </div>)
  }

}
