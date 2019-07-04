import * as React from 'react'
import * as styles from './highlight.scss'

export const Highlight = (props: {
  children: React.ReactNode,
}) => <span className={styles.highlight} >{props.children}</span>
