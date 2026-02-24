// ─── Enums ───────────────────────────────────────────────────────────────────

export type UnitType =
  | 'Смена' | 'Месяц' | 'Неделя' | 'День' | 'Час'
  | 'Шт' | 'Км' | 'Аккорд' | 'Серия' | 'Ролик' | 'Номер/ночь'

export type TaxType = 'СЗ' | 'ИП' | 'НДС' | 'ИП+НДС' | 'ФЛ' | 'Без налога'

export type UserRole = 'admin' | 'line_producer' | 'accountant' | 'viewer'

export type Currency = 'RUB' | 'USD' | 'EUR'

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ProjectParam {
  key: string
  value: string
}

export interface Project {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
  currency: Currency
  params: ProjectParam[]
}

export interface BudgetLineCalc {
  plan_net: number
  plan_tax_1: number
  plan_tax_2: number
  plan_gross: number
  plan_ot_gross: number
  plan_total: number
  fact_net: number
  fact_tax_1: number
  fact_tax_2: number
  fact_gross: number
  fact_ot_gross: number
  fact_total: number
}

export interface BudgetLine {
  id: number
  subcategory_id: number
  name: string
  contractor: string | null
  unit_type: UnitType
  rate: number
  qty_plan: number
  qty_fact: number
  date_start: string | null
  date_end: string | null
  tax_type: TaxType
  tax_rate_1: number
  tax_rate_2: number
  ot_rate: number
  ot_hours_plan: number
  ot_shifts_plan: number
  ot_hours_fact: number
  ot_shifts_fact: number
  note: string | null
  order_index: number
  paid: number
  calc: BudgetLineCalc
  limit_amount: number | null
}

export interface BudgetSubcategory {
  id: number
  name: string
  order_index: number
  lines: BudgetLine[]
}

export interface BudgetCategory {
  id: number
  name: string
  order_index: number
  subcategories: BudgetSubcategory[]
}

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null
  token: string | null
}
