
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

export const left = <a>(_: a): Left<a> => ({ k: 'l', v: _ })

export const right = <a>(_: a): Right<a> => ({ k: 'r', v: _ })

export const isLeft = <a, b>(_: Either<a, b>): _ is Left<a> => _.k === 'l'

export const isRight = <a, b>(_: Either<a, b>): _ is Right<b> => _.k === 'r'

export const none = (): None => left<Unit>({})

export const some = <a>(_: a): Some<a> => right<a>(_)

export const isSome = isRight

export const isNone = isLeft
