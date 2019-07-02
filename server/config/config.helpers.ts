import { Maybe, some, none } from '../../shared/fun'

export const getEnv = (name: string): Maybe<string> => {
  const value = process.env[name]
  return value ? some(value) : none()
}
