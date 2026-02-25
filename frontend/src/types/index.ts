// Пользователи и авторизация
export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superadmin: boolean
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export type UserRole = 'PRODUCER' | 'LINE_PRODUCER' | 'DIRECTOR' | 'ASSISTANT' | 'CLERK'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  PRODUCER: 'Продюсер',
  LINE_PRODUCER: 'Линейный продюсер',
  DIRECTOR: 'Директор',
  ASSISTANT: 'Ассистент продюсера',
  CLERK: 'Делопроизводитель',
}

// Проекты
export type ProjectStatus = 'PREP' | 'PRODUCTION' | 'POST' | 'CLOSED'
export type ExchangeRateMode = 'CBR_ON_DATE' | 'FIXED'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PREP: 'Подготовка',
  PRODUCTION: 'Производство',
  POST: 'Постпродакшн',
  CLOSED: 'Закрыт',
}

export interface Project {
  id: string
  name: string
  currency_primary: string
  currencies_allowed: string[]
  exchange_rate_mode: ExchangeRateMode
  exchange_rate_fixed: number | null
  status: ProjectStatus
  created_at: string
}

export interface ProjectUser {
  id: string
  project_id: string
  user_id: string
  role: UserRole
  user: User
}

// Контрагенты
export type ContractorType = 'FL' | 'SZ' | 'IP' | 'OOO'

export const CONTRACTOR_TYPE_LABELS: Record<ContractorType, string> = {
  FL: 'Физическое лицо',
  SZ: 'Самозанятый',
  IP: 'ИП',
  OOO: 'ООО',
}

export interface Contractor {
  id: string
  full_name: string
  type: ContractorType
  inn: string | null
  phone: string | null
  email: string | null
  currency: string
  tax_scheme_id: string | null
  telegram_id: string | null
  created_at: string
  has_passport: boolean
  has_bank_details: boolean
}

// Налоговые схемы
export type TaxComponentType = 'INTERNAL' | 'EXTERNAL'
export type TaxRecipient = 'CONTRACTOR' | 'BUDGET'

export interface TaxComponent {
  id: string
  name: string
  rate: number
  type: TaxComponentType
  recipient: TaxRecipient
  sort_order: number
}

export interface TaxScheme {
  id: string
  name: string
  is_system: boolean
  components: TaxComponent[]
}

// Бюджет
export type BudgetLineType = 'GROUP' | 'ITEM' | 'SPREAD_ITEM'

export interface BudgetLine {
  id: string
  project_id: string
  parent_id: string | null
  sort_order: number
  level: number
  code: string
  name: string
  type: BudgetLineType
  unit: string | null
  quantity_units: number
  rate: number
  quantity: number
  tax_scheme_id: string | null
  tax_override: boolean
  currency: string
  limit_amount: number

  // Вычисляемые
  subtotal: number
  tax_amount: number
  total: number

  // Производственные данные
  accrued: number
  paid: number
  closed: number
  advance: number

  children: BudgetLine[]
  updated_at: string
}
