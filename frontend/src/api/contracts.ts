import client from './client'
import type { Contract } from '../types'

export interface ContractCreateData {
  number: string
  project_id: string
  contractor_id: string
  payment_type: string
  payment_period?: string | null
  currency?: string
  status?: string
  signed_at?: string | null
  valid_from?: string | null
  valid_to?: string | null
  tax_scheme_id?: string | null
  tax_override?: boolean
  notes?: string | null
  budget_line_ids?: string[]
}

export const contractsApi = {
  list: (params?: { project_id?: string; contractor_id?: string }) =>
    client.get<Contract[]>('/contracts', { params }).then((r) => r.data),

  get: (id: string) => client.get<Contract>(`/contracts/${id}`).then((r) => r.data),

  create: (data: ContractCreateData) =>
    client.post<Contract>('/contracts', data).then((r) => r.data),

  update: (id: string, data: Partial<ContractCreateData>) =>
    client.patch<Contract>(`/contracts/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/contracts/${id}`),
}
