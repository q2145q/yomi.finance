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
  _expanded: boolean
  _hasChildren: boolean

  code: string
  name: string
  unit: string
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

function flattenTree(
  lines: BudgetLine[],
  collapsedIds: Set<string>,
  parentVisible = true,
): FlatRow[] {
  const result: FlatRow[] = []

  for (const line of lines) {
    const isExpanded = !collapsedIds.has(line.id)
    const row: FlatRow = {
      _id: line.id,
      _parentId: line.parent_id,
      _level: line.level,
      _type: line.type,
      _expanded: isExpanded,
      _hasChildren: line.children.length > 0,

      code: line.code,
      name: line.name,
      unit: line.unit || '',
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
    }
    result.push(row)

    if (isExpanded && line.children.length > 0) {
      result.push(...flattenTree(line.children, collapsedIds, true))
    }
  }

  return result
}

export function buildTableData(tree: BudgetLine[], collapsedIds: Set<string>): FlatRow[] {
  return flattenTree(tree, collapsedIds)
}

export function formatNumber(val: number): string {
  if (!val) return ''
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(val)
}
