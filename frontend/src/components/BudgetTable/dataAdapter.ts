/**
 * Преобразует иерархию BudgetCategory[] → плоский массив строк для Handsontable.
 *
 * Структура:
 *   category row    → «АКТЕРЫ»       в колонке category,    итого в calc-колонках
 *   subcategory row → «Главные роли» в колонке subcategory, итого в calc-колонках
 *   line row        → «Актер»        в колонке name,        все поля заполнены
 *
 * Ключи полей точно соответствуют COLUMN_DEFS[].key — это критично для getData().
 */

import type { BudgetCategory, BudgetLine, BudgetSubcategory } from '@/types'

export type RowType = 'category' | 'subcategory' | 'line'

export interface TableRow {
  rowType: RowType
  categoryId: number
  subcategoryId?: number
  lineId?: number

  // ── Поля колонок (ключи = COLUMN_DEFS[].key) ──────────────────────────────
  category: string        // заполнено только для category-строк
  subcategory: string     // заполнено только для subcategory-строк
  name: string            // заполнено только для line-строк

  contractor: string
  unit_type: string
  rate: number | string
  qty_plan: number | string
  qty_fact: number | string
  date_start: string
  date_end: string
  tax_type: string
  tax_rate_1: number | string
  tax_rate_2: number | string
  ot_rate: number | string
  ot_hours_plan: number | string
  ot_shifts_plan: number | string
  ot_hours_fact: number | string
  ot_shifts_fact: number | string

  calc_plan_gross: number | string
  calc_plan_tax: number | string
  calc_plan_total: number | string
  calc_fact_gross: number | string
  calc_fact_tax: number | string
  calc_fact_total: number | string
  limit_amount: number | string
  budget_limit_pct: string
  limit_fact_pct: string
  paid: number | string
  remainder: number | string
  note: string
}

// ─────────────────────────────────────────────────────────────────────────────

export function buildTableData(categories: BudgetCategory[]): TableRow[] {
  const rows: TableRow[] = []

  for (const cat of [...categories].sort((a, b) => a.order_index - b.order_index)) {
    let catPlanTotal = 0, catFactTotal = 0, catLimitTotal = 0
    let hasLimit = false
    const subRows: TableRow[] = []

    for (const sub of [...cat.subcategories].sort((a, b) => a.order_index - b.order_index)) {
      let subPlanTotal = 0, subFactTotal = 0, subLimitTotal = 0
      const lineRows: TableRow[] = []

      for (const line of [...sub.lines].sort((a, b) => a.order_index - b.order_index)) {
        const c = line.calc
        subPlanTotal += c.plan_total
        subFactTotal += c.fact_total
        if (line.limit_amount !== null) {
          subLimitTotal += line.limit_amount
          hasLimit = true
        }
        lineRows.push(makeLineRow(cat, sub, line))
      }

      catPlanTotal += subPlanTotal
      catFactTotal += subFactTotal
      catLimitTotal += subLimitTotal

      subRows.push(makeSubcategoryRow(cat, sub, subPlanTotal, subFactTotal, hasLimit ? subLimitTotal : null))
      subRows.push(...lineRows)
    }

    rows.push(makeCategoryRow(cat, catPlanTotal, catFactTotal, hasLimit ? catLimitTotal : null))
    rows.push(...subRows)
  }

  return rows
}

// ─── Строители ────────────────────────────────────────────────────────────────

function makeCategoryRow(
  cat: BudgetCategory,
  planTotal: number,
  factTotal: number,
  limitTotal: number | null,
): TableRow {
  return {
    rowType: 'category',
    categoryId: cat.id,
    category: cat.name,
    subcategory: '',
    name: '',
    ...emptyEditable(),
    ...totals(planTotal, factTotal, limitTotal),
  }
}

function makeSubcategoryRow(
  cat: BudgetCategory,
  sub: BudgetSubcategory,
  planTotal: number,
  factTotal: number,
  limitTotal: number | null,
): TableRow {
  return {
    rowType: 'subcategory',
    categoryId: cat.id,
    subcategoryId: sub.id,
    category: '',
    subcategory: sub.name,
    name: '',
    ...emptyEditable(),
    ...totals(planTotal, factTotal, limitTotal),
  }
}

function makeLineRow(cat: BudgetCategory, sub: BudgetSubcategory, line: BudgetLine): TableRow {
  const c = line.calc
  const planTax = c.plan_tax_1 + c.plan_tax_2
  const factTax = c.fact_tax_1 + c.fact_tax_2
  const lim = line.limit_amount
  return {
    rowType: 'line',
    categoryId: cat.id,
    subcategoryId: sub.id,
    lineId: line.id,
    category: '',
    subcategory: '',
    name: line.name,
    contractor: line.contractor ?? '',
    unit_type: line.unit_type,
    rate: line.rate,
    qty_plan: line.qty_plan,
    qty_fact: line.qty_fact,
    date_start: line.date_start ?? '',
    date_end: line.date_end ?? '',
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
    limit_amount: lim ?? '',
    budget_limit_pct: lim ? pct(c.plan_total, lim) : '',
    limit_fact_pct:   lim ? pct(c.fact_total,  lim) : '',
    paid: line.paid,
    remainder: c.fact_total - line.paid,
    note: line.note ?? '',
  }
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function emptyEditable() {
  return {
    contractor: '', unit_type: '', rate: '', qty_plan: '', qty_fact: '',
    date_start: '', date_end: '', tax_type: '', tax_rate_1: '', tax_rate_2: '',
    ot_rate: '', ot_hours_plan: '', ot_shifts_plan: '',
    ot_hours_fact: '', ot_shifts_fact: '',
    paid: '', remainder: '', note: '',
  }
}

function totals(plan: number, fact: number, lim: number | null) {
  return {
    calc_plan_gross: plan,
    calc_plan_tax: '',
    calc_plan_total: plan,
    calc_fact_gross: fact,
    calc_fact_tax: '',
    calc_fact_total: fact,
    limit_amount: lim ?? '',
    budget_limit_pct: lim ? pct(plan, lim) : '',
    limit_fact_pct:   lim ? pct(fact, lim) : '',
  }
}

function pct(value: number, base: number): string {
  if (!base) return ''
  const delta = (value / base - 1) * 100
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}
