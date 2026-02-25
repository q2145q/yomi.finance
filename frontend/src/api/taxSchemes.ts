import client from './client'
import type { TaxScheme } from '../types'

export const taxSchemesApi = {
  list: () => client.get<TaxScheme[]>('/tax-schemes').then((r) => r.data),

  create: (data: { name: string; components: Array<{ name: string; rate: number; type: string; recipient: string; sort_order: number }> }) =>
    client.post<TaxScheme>('/tax-schemes', data).then((r) => r.data),
}
