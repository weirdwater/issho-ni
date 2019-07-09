import { authenticatedHeaders } from '../shared/headers'
import { SelfUserDTO, SessionDTO, UsersSessionDTO } from '../../shared/dto'

export const getAllSessionsForUser = (token: string) => (ownerId: number) => async (): Promise<UsersSessionDTO[]> => {
  const res = await fetch('/api/user/me/sessions', {
    headers: authenticatedHeaders(token),
  })

  return res.json()
}

export const sessionApi = (token: string, user: SelfUserDTO) => {

  return {
    getAll: getAllSessionsForUser(token)(user.id),
  }

}
