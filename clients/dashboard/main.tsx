import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Sentry from '@sentry/browser'
import { DashboardApp } from './dashboardApp'

if ((window as any).sentryData) {
  Sentry.init({
    ...(window as any).sentryData,
  })
  Sentry.setTag('client', 'dashboard')
}

ReactDOM.render(<DashboardApp />, document.getElementById('react-app'))
