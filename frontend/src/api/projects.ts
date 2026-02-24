import api from './client'
import type { Project } from '@/types'

export const projectsApi = {
  list: () => api.get<Project[]>('/projects/').then((r) => r.data),

  get: (id: number) => api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: {
    name: string
    start_date?: string
    end_date?: string
    currency?: string
    params?: Record<string, string>
  }) => api.post<Project>('/projects/', data).then((r) => r.data),

  update: (
    id: number,
    data: Partial<{
      name: string
      start_date: string
      end_date: string
      currency: string
      params: Record<string, string>
    }>
  ) => api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/projects/${id}`),
}
