import { Some, Maybe, none, some } from '../../shared/fun'
import { AuthenticateUserDTO, SelfUserDTO } from '../../shared/dto';
import { baseHeaders, authenticatedHeaders } from '../shared/headers';
import { ApiException } from '../shared/apiExceptions';
import { UnauthorizedException } from '../shared/apiExceptions/unauthorizedException';
import * as Cookie from 'js-cookie';

const sessionTokenCookie = 'user_session_token'

export const loadSessionToken = (): Maybe<string> => {
  const token = Cookie.get(sessionTokenCookie)
  return token !== undefined ? some(token) : none()
}

export const authenticateUser = async (email: string, password: string): Promise<string> => {
  const dto: AuthenticateUserDTO = { email, password }

  const res = await fetch('/api/auth/user', {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(dto),
  })

  if (res.status === 400) {
    const e = await res.json()
    if (e && e.message && e.message.length) {
      const m = e.message[0]
      if (m.property === 'email' && m.constraints && m.constraints.isEmail) {
        throw new UnauthorizedException('Email must be an email')
      }
    }
    throw new UnauthorizedException('Could not login: Double check email & password.')
  }

  if (res.status === 401) {
    throw new UnauthorizedException('Could not login: Email and password did not match.')
  }

  if (res.status !== 201) {
    throw new ApiException(`Could not authenticate user: ${res.statusText}`)
  }

  const token = await res.text()
  Cookie.set(sessionTokenCookie, token)

  return token
}

export const getSelf = async (token: string): Promise<SelfUserDTO> => {
  const res = await fetch('/api/user/me', {
    headers: authenticatedHeaders(token),
  })

  if (res.status === 401) {
    throw new UnauthorizedException('Session token not authorized')
  }

  if (!res.ok) {
    throw new ApiException(`Something went wrong fetching the current user: ${res.statusText}`)
  }

  return res.json()
}
