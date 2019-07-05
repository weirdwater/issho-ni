import * as React from 'react'
import * as styles from './header.scss'
import { Heading } from '../../shared/components/heading';
import { Highlight } from '../../shared/components/highlight';
import { LinkButton } from '../../shared/components/button';

export const Header = () => (
  <header className={styles.header} >
    <img src='/assets/img/impression-band.jpeg' className={styles.background} />
    <div className={styles.logoWrapper}>
      <Heading w={1} className={styles.logo}><Highlight>一緒に</Highlight>カラオケ</Heading>
      <Heading w={2} className={styles.tagline}>Karaoke <Highlight>Together</Highlight></Heading>
    </div>
    <div className={styles.liveTeaser} >
      <Heading w={2} >Got a code?</Heading>
      <LinkButton label='Join now' href='/live' />
    </div>
  </header>
)
