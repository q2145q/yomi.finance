import client from './client'
import type { Project, ProjectUser } from '../types'

export const projectsApi = {
  list: () => client.get<Project[]>('/projects').then((r) => r.data),

  get: (id: string) => client.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; currency_primary?: string; status?: string }) =>
    client.post<Project>('/projects', data).then((r) => r.data),

  update: (id: string, data: Partial<Project>) =>
    client.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  getTeam: (id: string) => client.get<ProjectUser[]>(`/projects/${id}/team`).then((r) => r.data),

  addMember: (projectId: string, userId: string, role: string) =>
    client.post<ProjectUser>(`/projects/${projectId}/team`, { user_id: userId, role }).then((r) => r.data),

  removeMember: (projectId: string, userId: string) =>
    client.delete(`/projects/${projectId}/team/${userId}`),
}
