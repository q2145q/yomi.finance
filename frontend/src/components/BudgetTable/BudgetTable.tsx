import React, { useEffect, useRef, useState, useCallback } from 'react'
import Handsontable from 'handsontable'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'

import type { BudgetLine, TaxScheme } from '../../types'
import { buildTableData } from './dataAdapter'
import type { FlatRow } from './dataAdapter'
import { buildHotColumns, buildHotHeaders } from './columns'
import { budgetApi } from '../../api/budget'
import { taxSchemesApi } from '../../api/taxSchemes'

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
  const [taxSchemes, setTaxSchemes] = useState<TaxScheme[]>([])
  const [selectedRow, setSelectedRow] = useState<FlatRow | null>(null)
  const [adding, setAdding] = useState(false)

  // Загружаем налоговые схемы один раз
  useEffect(() => {
    taxSchemesApi.list().then(setTaxSchemes).catch(() => {})
  }, [])

  // Карта id→name и name→id для налоговых схем
  const taxSchemeIdToName = useCallback(
    (id: string | null) => taxSchemes.find((s) => s.id === id)?.name || '',
    [taxSchemes],
  )
  const taxSchemeNameToId = useCallback(
    (name: string) => taxSchemes.find((s) => s.name === name)?.id || null,
    [taxSchemes],
  )

  // Пересчитываем плоский список при изменении дерева, групп или схем
  useEffect(() => {
    const rows = buildTableData(tree, collapsedIds)
    rows.forEach((r) => {
      r.tax_scheme_name = taxSchemeIdToName(r.tax_scheme_id)
    })
    setFlatData(rows)
  }, [tree, collapsedIds, taxSchemeIdToName])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Трекинг выбранной строки
  const handleAfterSelection = useCallback(
    (r1: number) => {
      setSelectedRow(flatData[r1] || null)
    },
    [flatData],
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
          let patchData: Record<string, unknown>
          if (prop === 'tax_scheme_name') {
            patchData = { tax_scheme_id: taxSchemeNameToId(newVal as string) }
          } else {
            patchData = { [prop as string]: newVal }
          }
          await budgetApi.updateLine(rowData._id, patchData as Partial<BudgetLine>)
          onUpdate()
        } catch {
          // noop
        } finally {
          setSaving(false)
        }
      }
    },
    [flatData, onUpdate, taxSchemeNameToId],
  )

  // Добавление строк
  const handleAdd = useCallback(
    async (type: 'category' | 'subcategory' | 'item') => {
      if (adding) return
      setAdding(true)
      try {
        if (type === 'category') {
          await budgetApi.createLine(projectId, {
            name: 'Новый раздел',
            type: 'GROUP',
            level: 0,
            parent_id: null,
            sort_order: 9999,
          } as Partial<BudgetLine>)
        } else if (type === 'subcategory') {
          // Родитель — ближайшая категория (level 0) от выбранной строки
          let parentId: string | null = null
          if (selectedRow?._level === 0) parentId = selectedRow._id
          else if (selectedRow?._parentId) {
            const parent = flatData.find((r) => r._id === selectedRow._parentId)
            parentId = parent?._level === 0 ? parent._id : selectedRow._parentId
          }
          if (!parentId) { alert('Выберите раздел для добавления подраздела'); return }
          await budgetApi.createLine(projectId, {
            name: 'Новый подраздел',
            type: 'GROUP',
            level: 1,
            parent_id: parentId,
            sort_order: 9999,
          } as Partial<BudgetLine>)
        } else if (type === 'item') {
          // Родитель — ближайшая группа (level 0 или 1)
          let parentId: string | null = null
          let level = 2
          if (selectedRow?._type === 'GROUP') {
            parentId = selectedRow._id
            level = selectedRow._level + 1
          } else if (selectedRow?._parentId) {
            parentId = selectedRow._parentId
            level = selectedRow._level
          }
          if (!parentId) { alert('Выберите раздел или подраздел для добавления статьи'); return }
          await budgetApi.createLine(projectId, {
            name: 'Новая статья',
            type: 'ITEM',
            level,
            parent_id: parentId,
            sort_order: 9999,
          } as Partial<BudgetLine>)
        }
        onUpdate()
      } catch {
        alert('Ошибка добавления строки')
      } finally {
        setAdding(false)
      }
    },
    [adding, selectedRow, flatData, projectId, onUpdate],
  )

  // Удаление строки
  const handleDeleteSelected = useCallback(async () => {
    if (!selectedRow) return
    if (!confirm(`Удалить "${selectedRow.name}"?`)) return
    setSaving(true)
    try {
      await budgetApi.deleteLine(selectedRow._id)
      setSelectedRow(null)
      onUpdate()
    } catch {
      alert('Ошибка удаления')
    } finally {
      setSaving(false)
    }
  }, [selectedRow, onUpdate])

  const rowClassNames = flatData.map((row) => {
    if (row._level === 0) return 'row-category'
    if (row._level === 1) return 'row-subcategory'
    return ''
  })

  // Рендер ячейки name
  const nameRenderer = useCallback(
    (_instance: Handsontable, td: HTMLTableCellElement, row: number) => {
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

      td.appendChild(document.createTextNode(rowData.name))

      if (rowData._level === 0) td.style.fontWeight = '700'
      else if (rowData._level === 1) td.style.fontWeight = '600'
    },
    [flatData, toggleCollapse],
  )

  const numRenderer = useCallback(
    (_instance: Handsontable, td: HTMLTableCellElement, _row: number, _col: number, prop: string, value: unknown) => {
      if (!value || value === 0) {
        td.textContent = ''
      } else {
        td.textContent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value as number)
        td.style.textAlign = 'right'
        td.style.fontFamily = 'var(--font-mono)'
      }
    },
    [],
  )

  const taxSchemeNames = taxSchemes.map((s) => s.name)
  const columns = buildHotColumns(showExtra, taxSchemeNames)

  // Определяем доступность кнопок добавления
  const canAddSub = !!selectedRow && (selectedRow._level === 0 || !!selectedRow._parentId)
  const canAddItem = !!selectedRow
  const canDelete = !!selectedRow

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Тулбар */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* Добавление */}
        <div style={{ display: 'flex', gap: 4, marginRight: 8, borderRight: '1px solid var(--color-border)', paddingRight: 12 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleAdd('category')}
            disabled={adding}
            title="Добавить раздел верхнего уровня"
          >
            + Раздел
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleAdd('subcategory')}
            disabled={adding || !canAddSub}
            title="Добавить подраздел в выбранную категорию"
          >
            + Подраздел
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleAdd('item')}
            disabled={adding || !canAddItem}
            title="Добавить статью в выбранную группу"
          >
            + Статья
          </button>
          {canDelete && (
            <button
              className="btn btn-sm"
              style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              onClick={handleDeleteSelected}
              title={`Удалить: ${selectedRow?.name}`}
            >
              Удалить
            </button>
          )}
        </div>

        {/* Просмотр */}
        <button
          className={`btn btn-sm ${showExtra ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowExtra((v) => !v)}
        >
          {showExtra ? 'Скрыть финансы' : 'Показать финансы'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCollapsedIds(new Set())}
        >
          Развернуть всё
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCollapsedIds(new Set(tree.map((l) => l.id)))}
        >
          Свернуть всё
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => budgetApi.loadTemplate(projectId).then(onUpdate)}
          >
            Загрузить шаблон
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              budgetApi.exportExcel(projectId).then((r) => {
                const url = URL.createObjectURL(r.data)
                const a = document.createElement('a')
                a.href = url
                a.download = 'budget.xlsx'
                a.click()
              })
            }
          >
            Экспорт xlsx
          </button>
          {(saving || adding) && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {adding ? 'Добавление...' : 'Сохранение...'}
            </span>
          )}
        </div>
      </div>

      {/* Подсказка выбора */}
      {selectedRow && (
        <div style={{
          padding: '4px 16px',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          Выбрано: <strong>{selectedRow.name}</strong>
          {' · '}
          {selectedRow._level === 0 ? 'Раздел' : selectedRow._level === 1 ? 'Подраздел' : 'Статья'}
        </div>
      )}

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
          afterSelectionEnd={(r1) => handleAfterSelection(r1)}
          afterOnCellMouseDown={(_e, coords) => {
            const rowData = flatData[coords.row]
            if (rowData?._hasChildren && coords.col === 0) {
              toggleCollapse(rowData._id)
            }
          }}
        />
      </div>
    </div>
  )
}
