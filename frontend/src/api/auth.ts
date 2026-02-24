import api from './client'
import type { User } from '@/types'

interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (data: { email: string; name: string; password: string }) =>
    api.post<User>('/auth/register', data).then((r) => r.data),
}
