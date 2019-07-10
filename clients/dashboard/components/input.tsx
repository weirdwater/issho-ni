import * as React from 'react'
import { Maybe, isNone, some, none } from '../../../shared/fun';

export const Input = (props: {
  value: Maybe<string>,
  onValue: (_: Maybe<string>) => void,
  id: string,
  autoComplete?: string
  type?: string,
}) => <input
  value={isNone(props.value) ? '' : props.value.v}
  type={props.type || 'text'}
  autoComplete={props.autoComplete}
  id={props.id}
  onChange={e => {
    const value = e.target.value
    props.onValue(value === '' ? none() : some(value))
  }}
/>
