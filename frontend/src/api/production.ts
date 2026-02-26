import client from './client'
import type { ProductionReport, ReportEntry } from '../types'

export interface ReportCreateData {
  project_id: string
  shoot_day_number: number
  date: string
  location?: string | null
  shooting_group?: string | null
  notes?: string | null
  status?: string
}

export interface EntryCreateData {
  contractor_id: string
  budget_line_id?: string | null
  contract_id?: string | null
  source?: string
  shift_start?: string | null
  shift_end?: string | null
  lunch_break_minutes?: number
  gap_minutes?: number
  equipment?: string | null
  unit?: string
  quantity?: number
  rate?: number
  tax_scheme_id?: string | null
}

export const productionApi = {
  listReports: (projectId: string) =>
    client.get<ProductionReport[]>(`/production/projects/${projectId}/reports`).then((r) => r.data),

  createReport: (projectId: string, data: ReportCreateData) =>
    client.post<ProductionReport>(`/production/projects/${projectId}/reports`, data).then((r) => r.data),

  getReport: (reportId: string) =>
    client.get<ProductionReport>(`/production/reports/${reportId}`).then((r) => r.data),

  updateReport: (reportId: string, data: Partial<ReportCreateData>) =>
    client.patch<ProductionReport>(`/production/reports/${reportId}`, data).then((r) => r.data),

  deleteReport: (reportId: string) =>
    client.delete(`/production/reports/${reportId}`),

  createEntry: (reportId: string, data: EntryCreateData) =>
    client.post<ReportEntry>(`/production/reports/${reportId}/entries`, data).then((r) => r.data),

  updateEntry: (entryId: string, data: Partial<EntryCreateData> & { status?: string }) =>
    client.patch<ReportEntry>(`/production/entries/${entryId}`, data).then((r) => r.data),

  deleteEntry: (entryId: string) =>
    client.delete(`/production/entries/${entryId}`),
}
