
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

export const none = <a>(): Maybe<a> => ({ k: 'l', v: {} })

export const some = <a>(_: a): Maybe<a> => ({ k: 'r', v: _ })
