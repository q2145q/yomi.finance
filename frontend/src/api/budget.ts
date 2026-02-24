import api from './client'
import type { BudgetCategory, BudgetLine } from '@/types'

export const budgetApi = {
  // Full budget tree for a project
  get: (projectId: number) =>
    api.get<BudgetCategory[]>(`/projects/${projectId}/budget/`).then((r) => r.data),

  // Categories
  createCategory: (projectId: number, data: { name: string; order_index?: number }) =>
    api.post(`/projects/${projectId}/budget/categories`, data).then((r) => r.data),

  updateCategory: (projectId: number, catId: number, data: { name: string; order_index?: number }) =>
    api.patch(`/projects/${projectId}/budget/categories/${catId}`, data).then((r) => r.data),

  deleteCategory: (projectId: number, catId: number) =>
    api.delete(`/projects/${projectId}/budget/categories/${catId}`),

  // Subcategories
  createSubcategory: (projectId: number, data: { category_id: number; name: string; order_index?: number }) =>
    api.post(`/projects/${projectId}/budget/subcategories`, data).then((r) => r.data),

  deleteSubcategory: (projectId: number, subId: number) =>
    api.delete(`/projects/${projectId}/budget/subcategories/${subId}`),

  // Lines
  createLine: (projectId: number, data: Omit<BudgetLine, 'id' | 'calc' | 'limit_amount'>) =>
    api.post<BudgetLine>(`/projects/${projectId}/budget/lines`, data).then((r) => r.data),

  updateLine: (projectId: number, lineId: number, data: Partial<BudgetLine>) =>
    api.patch<BudgetLine>(`/projects/${projectId}/budget/lines/${lineId}`, data).then((r) => r.data),

  deleteLine: (projectId: number, lineId: number) =>
    api.delete(`/projects/${projectId}/budget/lines/${lineId}`),

  // Limit
  saveLimit: (projectId: number) =>
    api.post(`/projects/${projectId}/budget/save-limit`).then((r) => r.data),

  // Export
  exportXlsx: (projectId: number) => {
    const token = localStorage.getItem('yomi_token')
    window.open(`/api/projects/${projectId}/export/xlsx?token=${token}`, '_blank')
  },
}
