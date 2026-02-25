import client from './client'
import type { BudgetLine } from '../types'

export const budgetApi = {
  getTree: (projectId: string) =>
    client.get<BudgetLine[]>(`/projects/${projectId}/budget`).then((r) => r.data),

  createLine: (projectId: string, data: Partial<BudgetLine>) =>
    client.post<BudgetLine>(`/projects/${projectId}/budget/lines`, data).then((r) => r.data),

  updateLine: (lineId: string, data: Partial<BudgetLine>) =>
    client.patch<BudgetLine>(`/budget/lines/${lineId}`, data).then((r) => r.data),

  deleteLine: (lineId: string) =>
    client.delete(`/budget/lines/${lineId}`),

  moveLine: (lineId: string, parentId: string | null, sortOrder: number) =>
    client.post(`/budget/lines/${lineId}/move`, { parent_id: parentId, sort_order: sortOrder }),

  loadTemplate: (projectId: string) =>
    client.post(`/projects/${projectId}/budget/from-template`).then((r) => r.data),

  exportExcel: (projectId: string) =>
    client.get(`/projects/${projectId}/budget/export`, { responseType: 'blob' }),
}
