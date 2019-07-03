
// tslint:disable-next-line:no-empty-interface
export interface Unit {}

const u: Unit = {}

export const unit = (): Unit => u

export interface Left<a> {
  k: 'l',
  v: a
}

export interface Right<a> {
  k: 'r',
  v: a
}

export type Either<a, b> = Left<a> | Right<b>

export type Maybe<a> = Either<Unit, a>

export interface None extends Left<Unit> {}

export interface Some<a> extends Right<a> {}

export type Fun<a, b> = (_: a) => b

export interface Action<a> extends Fun<a, a> {}

export const left = <a>(_: a): Left<a> => ({ k: 'l', v: _ })

export const right = <a>(_: a): Right<a> => ({ k: 'r', v: _ })

export const isLeft = <a, b>(_: Either<a, b>): _ is Left<a> => _.k === 'l'

export const isRight = <a, b>(_: Either<a, b>): _ is Right<b> => _.k === 'r'

export const none = (): None => left(unit())

export const some = <a>(_: a): Some<a> => right<a>(_)

export const isSome = isRight

export const isNone = isLeft

export const doEither = <a, b>(e: Either<a, b>) => <c>(f: (_: a) => c, g: (_: b) => c) => isLeft(e) ? f(e.v) : g(e.v)

export interface AsyncLoaded<a> {
  s: 'loaded'
  v: a
}

export interface AsyncPristine {
  s: 'pristine'
}

export interface AsyncLoading {
  s: 'loading'
}

export interface AsyncError {
  s: 'error'
  m: string
}

export type Async<a> = AsyncPristine | AsyncLoading | AsyncLoaded<a> | AsyncError

export const loaded = <a>(v: a): AsyncLoaded<a> => ({ s: 'loaded', v })

export const loading = (): AsyncLoading => ({ s: 'loading' })

export const pristine = (): AsyncPristine => ({ s: 'pristine' })

export const error = (m: string): AsyncError => ({ s: 'error', m })

export const isLoaded = <a>(a: Async<a>): a is AsyncLoaded<a> => a.s === 'loaded'

export const isLoading = <a>(a: Async<a>): a is AsyncLoading => a.s === 'loading'

export const isPristine = <a>(a: Async<a>): a is AsyncPristine => a.s === 'pristine'

export const isError = <a>(a: Async<a>): a is AsyncError => a.s === 'error'
