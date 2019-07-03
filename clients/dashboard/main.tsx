import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { TestMsg } from '../shared/test'
import * as Sentry from '@sentry/browser'

if ((window as any).sentryData) {
  Sentry.init({
    ...(window as any).sentryData,
  })
  Sentry.setTag('client', 'dashboard')
}

ReactDOM.render(<TestMsg message='Dashboard' />, document.getElementById('react-app'))
