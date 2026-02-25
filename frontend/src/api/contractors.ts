import client from './client'
import type { Contractor } from '../types'

export const contractorsApi = {
  list: () => client.get<Contractor[]>('/contractors').then((r) => r.data),

  get: (id: string) => client.get<Contractor>(`/contractors/${id}`).then((r) => r.data),

  create: (data: Partial<Contractor>) =>
    client.post<Contractor>('/contractors', data).then((r) => r.data),

  update: (id: string, data: Partial<Contractor>) =>
    client.patch<Contractor>(`/contractors/${id}`, data).then((r) => r.data),
}
