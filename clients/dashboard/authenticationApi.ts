import { Some } from '../../shared/fun'
import { AuthenticateUserDTO } from '../../shared/dto';
import { baseHeaders } from '../shared/headers';
import { ApiException } from '../shared/apiExceptions';
import { UnauthorizedException } from '../shared/apiExceptions/unauthorizedException';
import * as Cookie from 'js-cookie';
import { capture } from '../shared/logger';

const sessionTokenCookie = 'user_session_token'

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
