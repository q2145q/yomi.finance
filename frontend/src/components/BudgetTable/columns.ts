/**
 * Конфигурация колонок Handsontable для бюджетной таблицы.
 */

export interface ColumnDef {
  key: string
  title: string
  width: number
  readOnly?: boolean
  numericFormat?: { pattern: string; culture: string }
  type?: string
}

// Основные колонки (всегда видны)
export const MAIN_COLUMNS: ColumnDef[] = [
  { key: 'name', title: 'Статья', width: 300 },
  { key: 'unit', title: 'Ед.изм.', width: 70 },
  { key: 'quantity_units', title: 'Кол-во ед.', width: 85, type: 'numeric' },
  { key: 'rate', title: 'Ставка', width: 100, type: 'numeric' },
  { key: 'quantity', title: 'Кол-во', width: 80, type: 'numeric' },
  { key: 'subtotal', title: 'Итого нетто', width: 110, readOnly: true, type: 'numeric' },
  { key: 'tax_amount', title: 'Налог', width: 90, readOnly: true, type: 'numeric' },
  { key: 'total', title: 'Итого брутто', width: 110, readOnly: true, type: 'numeric' },
]

// Дополнительные колонки (переключаемые)
export const EXTRA_COLUMNS: ColumnDef[] = [
  { key: 'limit_amount', title: 'Лимит', width: 110, type: 'numeric' },
  { key: 'accrued', title: 'Начислено', width: 110, readOnly: true, type: 'numeric' },
  { key: 'paid', title: 'Оплачено', width: 110, readOnly: true, type: 'numeric' },
  { key: 'closed', title: 'Закрыто', width: 110, readOnly: true, type: 'numeric' },
  { key: 'advance', title: 'Аванс', width: 100, readOnly: true, type: 'numeric' },
]

export function buildHotColumns(showExtra: boolean): object[] {
  const cols = [...MAIN_COLUMNS, ...(showExtra ? EXTRA_COLUMNS : [])]
  return cols.map((c) => ({
    data: c.key,
    readOnly: c.readOnly || false,
    width: c.width,
    type: c.type || 'text',
    numericFormat: c.type === 'numeric' ? { pattern: '0,0', culture: 'ru-RU' } : undefined,
  }))
}

export function buildHotHeaders(showExtra: boolean): string[] {
  return [...MAIN_COLUMNS, ...(showExtra ? EXTRA_COLUMNS : [])].map((c) => c.title)
}
