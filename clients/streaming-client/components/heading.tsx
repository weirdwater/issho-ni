import * as React from 'react'
import * as styles from './heading.scss'

export const Heading = (props: {
  w?: 1 | 2 | 3 | 4 | 5 | 6,
  className?: string,
  children: React.ReactNode,
}) => React.createElement(`h${props.w || 1}`, { className: `${styles.heading} ${props.className}` }, props.children)
