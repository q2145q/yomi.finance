/**
 * Конфигурация колонок Handsontable для бюджетной таблицы.
 */

// Стандартные единицы измерения для кинопроизводства
export const UNIT_OPTIONS = [
  '', 'дн', 'смена', 'ч', 'нед', 'мес',
  'чел', 'чел/дн', 'чел/смена',
  'шт', 'комплект', 'набор',
  'м', 'м²', 'км', 'кг', 'л',
  'руб', '%',
]

export interface ColumnDef {
  key: string
  title: string
  width: number
  readOnly?: boolean
  type?: string
}

// Основные колонки (всегда видны)
export const MAIN_COLUMNS: ColumnDef[] = [
  { key: 'name', title: 'Статья', width: 300 },
  { key: 'unit', title: 'Ед.изм.', width: 80 },
  { key: 'quantity_units', title: 'Кол-во ед.', width: 85, type: 'numeric' },
  { key: 'rate', title: 'Ставка', width: 100, type: 'numeric' },
  { key: 'quantity', title: 'Кол-во', width: 80, type: 'numeric' },
  { key: 'subtotal', title: 'Итого нетто', width: 110, readOnly: true, type: 'numeric' },
  { key: 'tax_scheme_name', title: 'Налог', width: 130 },
  { key: 'tax_amount', title: 'Сумма налога', width: 110, readOnly: true, type: 'numeric' },
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

export function buildHotColumns(
  showExtra: boolean,
  taxSchemeNames: string[],
): object[] {
  const cols = [...MAIN_COLUMNS, ...(showExtra ? EXTRA_COLUMNS : [])]
  return cols.map((c) => {
    if (c.key === 'unit') {
      return {
        data: c.key,
        readOnly: false,
        width: c.width,
        type: 'autocomplete',
        source: UNIT_OPTIONS,
        strict: false,
        trimDropdown: false,
      }
    }
    if (c.key === 'tax_scheme_name') {
      return {
        data: c.key,
        readOnly: false,
        width: c.width,
        type: 'dropdown',
        source: ['', ...taxSchemeNames],
      }
    }
    return {
      data: c.key,
      readOnly: c.readOnly || false,
      width: c.width,
      type: c.type || 'text',
      numericFormat: c.type === 'numeric' ? { pattern: '0,0', culture: 'ru-RU' } : undefined,
    }
  })
}

export function buildHotHeaders(showExtra: boolean): string[] {
  return [...MAIN_COLUMNS, ...(showExtra ? EXTRA_COLUMNS : [])].map((c) => c.title)
}
