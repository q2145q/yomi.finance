import client from './client'
import type { TokenPair, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<TokenPair>('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refresh_token: string) =>
    client.post<TokenPair>('/auth/refresh', { refresh_token }).then((r) => r.data),

  me: () => client.get<User>('/auth/me').then((r) => r.data),
}
