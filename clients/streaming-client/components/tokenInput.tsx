import * as React from 'react'
import * as styles from './tokenInput.scss'
import { Maybe, none, some, isSome } from '../../../shared/fun';

export const TokenInput = (props: {
  value: Maybe<string>,
  limit?: number
  onChange: (v: Maybe<string>) => void,
}) => <input type='text' className={styles.field} value={isSome(props.value) ? props.value.v : ''} onChange={e => {
  const value = e.target.value
  if (props.limit !== undefined && value.length > props.limit) {
    return
  }
  props.onChange(value === '' ? none() : some(value))
}} />
