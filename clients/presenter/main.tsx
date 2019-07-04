import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { PresenterApp } from './presenterApp';
import * as Sentry from '@sentry/browser'
import { none, some, Maybe } from '../../shared/fun';

if ((window as any).sentryData) {
  Sentry.init({
    ...(window as any).sentryData,
  })
  Sentry.setTag('client', 'presenter')
}

const params = new URLSearchParams(window.location.search)

const maybeString = (s: string | null): Maybe<string> => s === null ? none() : some(s)

const props = {
  sessionId: maybeString(params.get('session')),
  sessionKey: maybeString(params.get('key')),
}

ReactDOM.render(<PresenterApp {...props} />, document.getElementById('react-app'))
