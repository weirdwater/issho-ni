import * as React from 'react'
import { Heading } from './heading'
import * as styles from './title.scss'

export const Title = (props: { children: React.ReactNode }) => <Heading className={styles.title} >{props.children}</Heading>

export const Subtitle = (props: { children: React.ReactNode }) => <Heading w={2} className={styles.subtitle} >{props.children}</Heading>
