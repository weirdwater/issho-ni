
export type PermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported' | 'loading'

export interface ClientCredentials {
  id: string
  key: string
}
