import type { ColumnSettings } from 'handsontable/settings'
import type { TaxType, UnitType } from '@/types'

export const UNIT_TYPES: UnitType[] = [
  'Смена', 'Месяц', 'Неделя', 'День', 'Час',
  'Шт', 'Км', 'Аккорд', 'Серия', 'Ролик', 'Номер/ночь',
]

export const TAX_TYPES: TaxType[] = ['СЗ', 'ИП', 'НДС', 'ИП+НДС', 'ФЛ', 'Без налога']

export const DEFAULT_TAX_RATES: Record<TaxType, [number, number]> = {
  'СЗ': [6, 0],
  'ИП': [6, 0],
  'НДС': [20, 0],
  'ИП+НДС': [6, 20],
  'ФЛ': [13, 30],
  'Без налога': [0, 0],
}

// Column key → display label mapping
export const COLUMN_DEFS = [
  // Fixed (frozen) columns
  { key: 'category',      label: 'Категория',         width: 160, readOnly: true },
  { key: 'subcategory',   label: 'Подкатегория',      width: 140, readOnly: true },
  { key: 'name',          label: 'Наименование',      width: 200 },
  // Editable data columns
  { key: 'contractor',    label: 'Контрагент',        width: 160 },
  { key: 'unit_type',     label: 'Ед. изм.',          width: 100, type: 'dropdown', source: UNIT_TYPES },
  { key: 'rate',          label: 'Ставка',            width: 100, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'qty_plan',      label: 'Кол-во план',       width: 90,  type: 'numeric' },
  { key: 'qty_fact',      label: 'Кол-во факт',       width: 90,  type: 'numeric' },
  { key: 'date_start',    label: 'Дата начала',       width: 110, type: 'date', dateFormat: 'DD.MM.YYYY' },
  { key: 'date_end',      label: 'Дата окончания',    width: 110, type: 'date', dateFormat: 'DD.MM.YYYY' },
  { key: 'tax_type',      label: 'Тип налога',        width: 110, type: 'dropdown', source: TAX_TYPES },
  { key: 'tax_rate_1',    label: 'Ставка налога 1, %',width: 110, type: 'numeric' },
  { key: 'tax_rate_2',    label: 'Ставка налога 2, %',width: 110, type: 'numeric' },
  { key: 'ot_rate',       label: 'Ставка ОТ (руб/ч)', width: 110, type: 'numeric' },
  { key: 'ot_hours_plan', label: 'Часов ОТ план',     width: 90,  type: 'numeric' },
  { key: 'ot_shifts_plan',label: 'Смен ОТ план',      width: 90,  type: 'numeric' },
  { key: 'ot_hours_fact', label: 'Часов ОТ факт',     width: 90,  type: 'numeric' },
  { key: 'ot_shifts_fact',label: 'Смен ОТ факт',      width: 90,  type: 'numeric' },
  // Calculated columns (readOnly)
  { key: 'calc_plan_gross',   label: 'Итого план (база)',    width: 130, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'calc_plan_tax',     label: 'Налог план',           width: 110, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'calc_plan_total',   label: 'Итого план (с нал.)',  width: 140, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'calc_fact_gross',   label: 'Итого факт (база)',    width: 130, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'calc_fact_tax',     label: 'Налог факт',           width: 110, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'calc_fact_total',   label: 'Итого факт (с нал.)', width: 140, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'limit_amount',      label: 'Лимит',                width: 120, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'budget_limit_pct',  label: 'Бюджет/Лимит %',      width: 120, readOnly: true },
  { key: 'limit_fact_pct',    label: 'Лимит/Факт %',        width: 120, readOnly: true },
  { key: 'paid',              label: 'Оплачено',             width: 110, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'remainder',         label: 'Остаток к оплате',     width: 140, readOnly: true, type: 'numeric', numericFormat: { pattern: '0,0', culture: 'ru-RU' } },
  { key: 'note',              label: 'Примечание',           width: 200 },
]

export const FROZEN_COLS = 3 // Категория, Подкатегория, Наименование
