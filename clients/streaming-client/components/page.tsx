import * as React from 'react'
import * as styles from './page.scss'

export const Page = (props: { className?: string, children: React.ReactNode }) =>
  <section className={`${styles.container} ${props.className}`} >{props.children}</section>
