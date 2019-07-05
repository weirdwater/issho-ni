import * as React from 'react'
import * as styles from './highlight.scss'

export const Highlight = (props: {
  children: React.ReactNode,
}) => <span className={styles.highlight} >{props.children}</span>

export const ShinyText = (props: {
  children: React.ReactNode,
}) => <span className={styles.paragraphHighlight} >{props.children}</span>
