
interface PasswordCredentials {
  credential?: string
  credentialType?: 'password'
}

interface OAuthCredentials {
  credential?: {
    accessToken: string;
    macKey: string;
  }
  credentialType?: 'oath'
}

export type IceServer = {
  urls: string | string[];
  username?: string;
} & (PasswordCredentials | OAuthCredentials)
