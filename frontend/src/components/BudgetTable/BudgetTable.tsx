import { useRef, useEffect, useCallback } from 'react'
import Handsontable from 'handsontable'
import { HotTable, HotTableClass } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.min.css'

import type { BudgetCategory } from '@/types'
import type { TableRow } from './dataAdapter'
import { buildTableData } from './dataAdapter'
import { COLUMN_DEFS, FROZEN_COLS } from './columns'
import { budgetApi } from '@/api/budget'
import toast from 'react-hot-toast'

registerAllModules()

interface Props {
  projectId: number
  categories: BudgetCategory[]
  onRefresh: () => void
}

const EDITABLE_KEYS = new Set([
  'name', 'contractor', 'unit_type', 'rate', 'qty_plan', 'qty_fact',
  'date_start', 'date_end', 'tax_type', 'tax_rate_1', 'tax_rate_2',
  'ot_rate', 'ot_hours_plan', 'ot_shifts_plan', 'ot_hours_fact', 'ot_shifts_fact',
  'paid', 'note',
])

const COL_KEYS = COLUMN_DEFS.map((c) => c.key)

export default function BudgetTable({ projectId, categories, onRefresh }: Props) {
  const hotRef = useRef<HotTableClass>(null)

  const tableData = buildTableData(categories)

  const getData = () => tableData.map((row) => COL_KEYS.map((k) => (row as Record<string, unknown>)[k] ?? ''))

  const columns: Handsontable.ColumnSettings[] = COLUMN_DEFS.map((def) => {
    const col: Handsontable.ColumnSettings = {
      data: COL_KEYS.indexOf(def.key),
      title: def.label,
      width: def.width,
      readOnly: !!def.readOnly,
    }
    if (def.type) col.type = def.type as string
    if ('source' in def) col.source = def.source as string[]
    if ('numericFormat' in def) col.numericFormat = def.numericFormat
    if ('dateFormat' in def) col.dateFormat = def.dateFormat as string
    return col
  })

  const handleAfterChange = useCallback(
    async (changes: Handsontable.CellChange[] | null) => {
      if (!changes) return
      for (const [rowIdx, colIdx, , newVal] of changes) {
        const row = tableData[rowIdx]
        if (!row || row.rowType !== 'line' || !row.lineId) continue
        const colKey = COL_KEYS[colIdx as number]
        if (!EDITABLE_KEYS.has(colKey)) continue
        try {
          await budgetApi.updateLine(projectId, row.lineId, { [colKey]: newVal })
          onRefresh()
        } catch {
          toast.error(`Ошибка сохранения: ${colKey}`)
        }
      }
    },
    [projectId, tableData, onRefresh]
  )

  const cells = (row: number): Handsontable.CellMeta => {
    const r = tableData[row]
    if (!r) return {}
    if (r.rowType === 'category') return { readOnly: true, className: 'row-category' }
    if (r.rowType === 'subcategory') return { readOnly: true, className: 'row-subcategory' }
    return {}
  }

  return (
    <div className="budget-table-wrapper">
      <HotTable
        ref={hotRef}
        data={getData()}
        columns={columns}
        rowHeaders={false}
        colHeaders={true}
        fixedColumnsLeft={FROZEN_COLS}
        contextMenu={true}
        manualColumnResize={true}
        manualRowMove={true}
        multiColumnSorting={false}
        search={true}
        copyPaste={true}
        undo={true}
        afterChange={handleAfterChange}
        cells={(row) => cells(row)}
        height="calc(100vh - 140px)"
        width="100%"
        stretchH="none"
        licenseKey="non-commercial-and-evaluation"
        language="ru-PL"
      />
    </div>
  )
}
