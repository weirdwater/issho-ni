import * as Sentry from '@sentry/browser';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PublicSite } from './publicSite';
import * as styles from '../shared/base.scss'

const s = styles.app

if ((window as any).sentryData) {
  Sentry.init({
    ...(window as any).sentryData,
  })
  Sentry.setTag('client', 'public')
}

ReactDOM.render(<PublicSite />, document.getElementById('react-app'))
