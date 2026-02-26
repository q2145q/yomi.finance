/**
 * Преобразует дерево BudgetLine в плоский массив для Handsontable.
 * Сохраняет информацию об уровне для стилизации.
 */
import type { BudgetLine } from '../../types'

export interface FlatRow {
  _id: string
  _parentId: string | null
  _level: number
  _type: string
  _hasChildren: boolean

  code: string
  name: string
  unit: string
  date_start: string | null
  date_end: string | null
  quantity_units: number
  rate: number
  quantity: number
  subtotal: number
  tax_amount: number
  total: number
  limit_amount: number
  accrued: number
  paid: number
  closed: number
  advance: number
  tax_scheme_id: string | null
  tax_scheme_name: string
  contractor_id: string | null
  contractor_name: string
}

// Конвертация YYYY-MM-DD → DD.MM.YYYY для отображения в Handsontable
function isoToDisplay(isoDate: string | null): string | null {
  if (!isoDate) return null
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

function flattenTree(lines: BudgetLine[]): FlatRow[] {
  const result: FlatRow[] = []

  for (const line of lines) {
    result.push({
      _id: line.id,
      _parentId: line.parent_id,
      _level: line.level,
      _type: line.type,
      _hasChildren: line.children.length > 0,

      code: line.code,
      name: line.name,
      unit: line.unit || '',
      date_start: isoToDisplay(line.date_start),
      date_end: isoToDisplay(line.date_end),
      quantity_units: line.quantity_units,
      rate: line.rate,
      quantity: line.quantity,
      subtotal: line.subtotal,
      tax_amount: line.tax_amount,
      total: line.total,
      limit_amount: line.limit_amount,
      accrued: line.accrued,
      paid: line.paid,
      closed: line.closed,
      advance: line.advance,
      tax_scheme_id: line.tax_scheme_id,
      tax_scheme_name: '',
      contractor_id: line.contractor_id,
      contractor_name: line.contractor_name || '',
    })

    if (line.children.length > 0) {
      result.push(...flattenTree(line.children))
    }
  }

  return result
}

export function buildTableData(tree: BudgetLine[]): FlatRow[] {
  return flattenTree(tree)
}

export function formatNumber(val: number): string {
  if (!val) return ''
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(val)
}
