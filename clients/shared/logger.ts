import * as Sentry from '@sentry/browser'

// tslint:disable-next-line:no-console
export const info = (...args: any[]) => console.info(...args)

// tslint:disable-next-line:no-console
export const warn = (...args: any[]) => console.warn(...args)

export const capture = (e: any) => Sentry.captureException(e)
