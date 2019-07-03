import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { PresenterApp } from './presenterApp';
import * as Sentry from '@sentry/browser'

if ((window as any).sentryData) {
  Sentry.init({
    ...(window as any).sentryData,
  })
  Sentry.setTag('client', 'presenter')
}

ReactDOM.render(<PresenterApp />, document.getElementById('react-app'))
