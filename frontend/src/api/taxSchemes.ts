import client from './client'
import type { TaxScheme } from '../types'

export type TaxComponentInput = {
  name: string
  rate: number
  type: string
  recipient: string
  sort_order: number
}

export const taxSchemesApi = {
  list: () => client.get<TaxScheme[]>('/tax-schemes').then((r) => r.data),

  create: (data: { name: string; components: TaxComponentInput[] }) =>
    client.post<TaxScheme>('/tax-schemes', data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/tax-schemes/${id}`),
}
