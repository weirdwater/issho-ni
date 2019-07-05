import * as React from 'react'
import * as styles from './button.scss'

export const Button = (props: {
  label: string,
  disabled?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
}) => <button className={styles.button} {...props} >{props.label}</button>

export const LinkButton = (props: {
  label: string,
  href: string,
  className?: string,
}) => <a href={props.href} className={`${styles.linkButton} ${props.className}`} >{props.label}</a>
