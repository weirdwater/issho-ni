
// tslint:disable-next-line:no-empty-interface
export interface Unit {}

export interface Left<a> {
  k: 'l',
  v: a
}

export interface Right<a> {
  k: 'r',
  v: a
}

export type Either<a, b> = Left<a> | Right<b>

export type Maybe<a>  = Either<Unit, a>

export type None = Left<Unit>

export type Some<a> = Right<a>

export type Fun<a, b> = (_: a) => b

export type Action<a> = Fun<a, a>

export const none = (): None => ({ k: 'l', v: {} })

export const some = <a>(_: a): Some<a> => ({ k: 'r', v: _ })

export const isSome = <a>(_: Maybe<a>): _ is Some<a> => _.k === 'r'

export const isNone = <a>(_: Maybe<a>): _ is None => _.k === 'l'
