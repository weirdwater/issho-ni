import * as React from 'react'
import * as styles from './heading.scss'

interface IndexedCss { [key: string]: string }

export const Heading = (props: {
  w?: 1 | 2 | 3 | 4 | 5 | 6,
  className?: string,
  children: React.ReactNode,
}) => {
  const heading = `h${props.w || 1}`
  return React.createElement(heading, { className: `${(styles as IndexedCss)[heading]} ${styles.heading} ${props.className}` }, props.children)
}
