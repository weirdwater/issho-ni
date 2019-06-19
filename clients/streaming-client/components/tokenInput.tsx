import * as React from 'react'
import * as styles from './tokenInput.scss'
import { Maybe, none, some } from '../../shared/fun';

export const TokenInput = (props: {
  value: Maybe<string>,
  onChange: (v: Maybe<string>) => void,
}) => <input type='text' className={styles.field} onChange={e => {
  const value = e.target.value
  props.onChange(value === '' ? none() : some(value))
}} />
