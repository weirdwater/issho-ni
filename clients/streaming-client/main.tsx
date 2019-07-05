import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Sentry from '@sentry/browser'
import { StreamingApp } from './streamingApp';
import * as styles from '../shared/base.scss'

const s = styles.app

if ((window as any).sentryData) {
  Sentry.init({
    ...(window as any).sentryData,
  })
  Sentry.setTag('client', 'source')
}

ReactDOM.render(<StreamingApp />, document.getElementById('react-app'))
