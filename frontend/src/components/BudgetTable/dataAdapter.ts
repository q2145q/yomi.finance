/**
 * Преобразует иерархию BudgetCategory[] → плоский массив строк для Handsontable.
 * Первые строки каждой группы — итоговые (нередактируемые).
 */

import type { BudgetCategory, BudgetLine, BudgetSubcategory } from '@/types'
import { calcLineTotals } from '@/utils/taxCalc'

export type RowType = 'category' | 'subcategory' | 'line'

export interface TableRow {
  rowType: RowType
  categoryId: number
  categoryName: string
  subcategoryId?: number
  subcategoryName?: string
  lineId?: number
  // Raw line data
  name: string
  contractor: string
  unit_type: string
  rate: number
  qty_plan: number
  qty_fact: number
  date_start: string
  date_end: string
  tax_type: string
  tax_rate_1: number
  tax_rate_2: number
  ot_rate: number
  ot_hours_plan: number
  ot_shifts_plan: number
  ot_hours_fact: number
  ot_shifts_fact: number
  // Calculated
  calc_plan_gross: number
  calc_plan_tax: number
  calc_plan_total: number
  calc_fact_gross: number
  calc_fact_tax: number
  calc_fact_total: number
  limit_amount: number | string
  budget_limit_pct: string
  limit_fact_pct: string
  paid: number
  remainder: number
  note: string
}

export function buildTableData(categories: BudgetCategory[]): TableRow[] {
  const rows: TableRow[] = []

  for (const cat of categories) {
    // Aggregate category totals
    let catPlanTotal = 0
    let catFactTotal = 0
    let catLimitTotal = 0
    let hasLimit = false

    const subRows: TableRow[] = []

    for (const sub of cat.subcategories) {
      let subPlanTotal = 0
      let subFactTotal = 0
      let subLimitTotal = 0

      const lineRows: TableRow[] = []

      for (const line of sub.lines) {
        const c = line.calc
        const planTotal = c.plan_total
        const factTotal = c.fact_total
        const limitAmt = line.limit_amount
        subPlanTotal += planTotal
        subFactTotal += factTotal
        if (limitAmt !== null) {
          subLimitTotal += limitAmt
          hasLimit = true
        }

        lineRows.push(buildLineRow(cat, sub, line))
      }

      catPlanTotal += subPlanTotal
      catFactTotal += subFactTotal
      catLimitTotal += subLimitTotal

      // Subcategory summary row
      subRows.push(buildSummaryRow('subcategory', cat, sub, subPlanTotal, subFactTotal, hasLimit ? subLimitTotal : null))
      subRows.push(...lineRows)
    }

    // Category summary row
    rows.push(buildSummaryRow('category', cat, undefined, catPlanTotal, catFactTotal, hasLimit ? catLimitTotal : null))
    rows.push(...subRows)
  }

  return rows
}

function buildLineRow(cat: BudgetCategory, sub: BudgetSubcategory, line: BudgetLine): TableRow {
  const c = line.calc
  const planTax = c.plan_tax_1 + c.plan_tax_2
  const factTax = c.fact_tax_1 + c.fact_tax_2
  const limitAmt = line.limit_amount
  const budgetLimitPct = limitAmt ? ((c.plan_total / limitAmt - 1) * 100).toFixed(1) + '%' : ''
  const limitFactPct = limitAmt ? ((c.fact_total / limitAmt - 1) * 100).toFixed(1) + '%' : ''

  return {
    rowType: 'line',
    categoryId: cat.id,
    categoryName: cat.name,
    subcategoryId: sub.id,
    subcategoryName: sub.name,
    lineId: line.id,
    name: line.name,
    contractor: line.contractor || '',
    unit_type: line.unit_type,
    rate: line.rate,
    qty_plan: line.qty_plan,
    qty_fact: line.qty_fact,
    date_start: line.date_start || '',
    date_end: line.date_end || '',
    tax_type: line.tax_type,
    tax_rate_1: line.tax_rate_1,
    tax_rate_2: line.tax_rate_2,
    ot_rate: line.ot_rate,
    ot_hours_plan: line.ot_hours_plan,
    ot_shifts_plan: line.ot_shifts_plan,
    ot_hours_fact: line.ot_hours_fact,
    ot_shifts_fact: line.ot_shifts_fact,
    calc_plan_gross: c.plan_gross,
    calc_plan_tax: planTax,
    calc_plan_total: c.plan_total,
    calc_fact_gross: c.fact_gross,
    calc_fact_tax: factTax,
    calc_fact_total: c.fact_total,
    limit_amount: limitAmt ?? '',
    budget_limit_pct: budgetLimitPct,
    limit_fact_pct: limitFactPct,
    paid: line.paid,
    remainder: c.fact_total - line.paid,
    note: line.note || '',
  }
}

function buildSummaryRow(
  rowType: 'category' | 'subcategory',
  cat: BudgetCategory,
  sub: BudgetSubcategory | undefined,
  planTotal: number,
  factTotal: number,
  limitTotal: number | null,
): TableRow {
  const budgetLimitPct = limitTotal ? ((planTotal / limitTotal - 1) * 100).toFixed(1) + '%' : ''
  const limitFactPct = limitTotal ? ((factTotal / limitTotal - 1) * 100).toFixed(1) + '%' : ''
  return {
    rowType,
    categoryId: cat.id,
    categoryName: cat.name,
    subcategoryId: sub?.id,
    subcategoryName: sub?.name,
    name: rowType === 'category' ? cat.name : (sub?.name ?? ''),
    contractor: '',
    unit_type: '',
    rate: 0,
    qty_plan: 0,
    qty_fact: 0,
    date_start: '',
    date_end: '',
    tax_type: '',
    tax_rate_1: 0,
    tax_rate_2: 0,
    ot_rate: 0,
    ot_hours_plan: 0,
    ot_shifts_plan: 0,
    ot_hours_fact: 0,
    ot_shifts_fact: 0,
    calc_plan_gross: planTotal,
    calc_plan_tax: 0,
    calc_plan_total: planTotal,
    calc_fact_gross: factTotal,
    calc_fact_tax: 0,
    calc_fact_total: factTotal,
    limit_amount: limitTotal ?? '',
    budget_limit_pct: budgetLimitPct,
    limit_fact_pct: limitFactPct,
    paid: 0,
    remainder: 0,
    note: '',
  }
}
