import * as React from 'react'
import * as styles from './introduction.scss'
import { Heading } from '../../shared/components/heading';
import { Button, LinkButton } from '../../shared/components/button';
import { ShinyText } from '../../shared/components/highlight';

export const Introduction = () => (
  <div className={styles.container} >
    <img className={styles.presenter} src='/assets/img/screenshot-presenter-client.png'
         alt={`A browserwindow displaying Issho Ni's presentation view.`} />
    <section className={styles.theSitch} >
      <Heading w={2} >Get that party started</Heading>
      <p>Afraid your guests won’t mingle? Smartphones have made it so easy to stay connected with friends that connecting with strangers has become
        an annoyance.</p>
      <p><ShinyText>Issho Ni</ShinyText> takes the isolating smartphone and turns it into a group activity. Turn on the TV,
        attach your laptop and host your very own group karaoke session. All your guests need to join is a smartphone.</p>
    </section>
    <section className={styles.noHassle}>
      <Heading w={2} >No installation required</Heading>
      <p><ShinyText>Issho Ni</ShinyText> uses state of the art web technologies that don’t require you, or your guests, to
        install anything. You heard that right, no apps, no plugins, no extra space required, no OS excluded. Everyone can join!</p>
      <LinkButton label='Get Started' href='/dashboard' className={styles.callToAction} />
    </section>
    <img className={styles.streamer} src='/assets/img/devices-source-client.png'
         alt={`An iOS and Android device side by side displaying Issho Ni's streaming view.`} />
    <div className={styles.background} ></div>
  </div>
)
