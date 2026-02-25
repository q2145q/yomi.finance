import React, { useEffect, useRef, useState, useCallback } from 'react'
import Handsontable from 'handsontable'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'

import type { BudgetLine } from '../../types'
import { buildTableData } from './dataAdapter'
import type { FlatRow } from './dataAdapter'
import { buildHotColumns, buildHotHeaders } from './columns'
import { budgetApi } from '../../api/budget'

registerAllModules()

interface Props {
  projectId: string
  tree: BudgetLine[]
  onUpdate: () => void
}

export const BudgetTable: React.FC<Props> = ({ projectId, tree, onUpdate }) => {
  const hotRef = useRef<any>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [showExtra, setShowExtra] = useState(false)
  const [flatData, setFlatData] = useState<FlatRow[]>([])
  const [saving, setSaving] = useState(false)

  // Пересчитываем плоский список при изменении дерева или раскрытых групп
  useEffect(() => {
    setFlatData(buildTableData(tree, collapsedIds))
  }, [tree, collapsedIds])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Клик по стрелке в ячейке name (toggle collapse)
  const handleCellClick = useCallback(
    (row: number, col: number, _: HTMLElement) => {
      if (col !== 0) return
      const rowData = flatData[row]
      if (rowData?._hasChildren) {
        toggleCollapse(rowData._id)
      }
    },
    [flatData, toggleCollapse]
  )

  // Сохранение изменённой ячейки
  const handleAfterChange = useCallback(
    async (changes: Handsontable.CellChange[] | null, source: string) => {
      if (!changes || source === 'loadData') return

      for (const [row, prop, , newVal] of changes) {
        const rowData = flatData[row]
        if (!rowData || rowData._type === 'GROUP') continue

        setSaving(true)
        try {
          await budgetApi.updateLine(rowData._id, { [prop as string]: newVal })
          onUpdate()
        } catch {
          // TODO: показать ошибку
        } finally {
          setSaving(false)
        }
      }
    },
    [flatData, onUpdate]
  )

  const rowClassNames = flatData.map((row) => {
    if (row._level === 0) return 'row-category'
    if (row._level === 1) return 'row-subcategory'
    return ''
  })

  // Рендер кнопки expand/collapse в ячейке name
  const nameRenderer = useCallback(
    (instance: Handsontable, td: HTMLTableCellElement, row: number, col: number) => {
      const rowData = flatData[row]
      if (!rowData) return

      const indent = rowData._level * 16
      td.innerHTML = ''
      td.style.paddingLeft = `${indent + 8}px`

      if (rowData._hasChildren) {
        const arrow = document.createElement('span')
        arrow.textContent = rowData._expanded ? '▼ ' : '▶ '
        arrow.style.cursor = 'pointer'
        arrow.style.color = 'var(--color-text-muted)'
        arrow.style.fontSize = '10px'
        arrow.style.marginRight = '4px'
        arrow.addEventListener('mousedown', (e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleCollapse(rowData._id)
        })
        td.appendChild(arrow)
      }

      const text = document.createTextNode(rowData.name)
      td.appendChild(text)

      if (rowData._level === 0) {
        td.style.fontWeight = '700'
      } else if (rowData._level === 1) {
        td.style.fontWeight = '600'
      }
    },
    [flatData, toggleCollapse]
  )

  const numRenderer = useCallback(
    (instance: Handsontable, td: HTMLTableCellElement, row: number, col: number, prop: string) => {
      const rowData = flatData[row]
      if (!rowData) return
      const val = (rowData as any)[prop as string]
      if (!val || val === 0) {
        td.textContent = ''
      } else {
        td.textContent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(val)
        td.style.textAlign = 'right'
        td.style.fontFamily = 'var(--font-mono)'
      }
    },
    [flatData]
  )

  const columns = buildHotColumns(showExtra)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Тулбар */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => budgetApi.loadTemplate(projectId).then(onUpdate)}
        >
          Загрузить шаблон
        </button>
        <button
          className={`btn btn-sm ${showExtra ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowExtra((v) => !v)}
        >
          {showExtra ? 'Скрыть финансы' : 'Показать финансы'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => budgetApi.exportExcel(projectId).then((r) => {
            const url = URL.createObjectURL(r.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `budget.xlsx`
            a.click()
          })}
        >
          Экспорт xlsx
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCollapsedIds(new Set())}
        >
          Развернуть всё
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const topLevel = new Set(tree.map((l) => l.id))
            setCollapsedIds(topLevel)
          }}
        >
          Свернуть всё
        </button>
        {saving && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Сохранение...</span>}
      </div>

      {/* Таблица */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <HotTable
          ref={hotRef}
          data={flatData}
          columns={columns}
          colHeaders={buildHotHeaders(showExtra)}
          rowHeaders={false}
          fixedColumnsStart={1}
          licenseKey="non-commercial-and-evaluation"
          height="100%"
          stretchH="none"
          manualColumnResize
          outsideClickDeselects={false}
          enterMoves={{ row: 1, col: 0 }}
          tabMoves={{ row: 0, col: 1 }}
          cells={(row) => {
            const rowData = flatData[row]
            if (!rowData) return {}
            return {
              className: rowClassNames[row] || '',
              readOnly: rowData._type === 'GROUP',
            }
          }}
          afterChange={handleAfterChange}
          afterOnCellMouseDown={(e, coords) => {
            handleCellClick(coords.row, coords.col, e.target as HTMLElement)
          }}
        />
      </div>
    </div>
  )
}
