import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AppLayout } from '../components/Layout/AppLayout'
import { productionApi, type EntryCreateData } from '../api/production'
import { contractorsApi } from '../api/contractors'
import { contractsApi } from '../api/contracts'
import { taxSchemesApi } from '../api/taxSchemes'
import { budgetApi } from '../api/budget'
import type {
  ProductionReport,
  ReportEntry,
  Contractor,
  Contract,
  TaxScheme,
  BudgetLine,
  ReportEntryStatus,
} from '../types'
import { REPORT_ENTRY_STATUS_LABELS } from '../types'

// Форматирование чисел
const fmt = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// HH:MM из строки вида HH:MM:SS
const timeShort = (t: string | null) => (t ? t.slice(0, 5) : '—')

function collectItems(lines: BudgetLine[]): BudgetLine[] {
  const result: BudgetLine[] = []
  const walk = (nodes: BudgetLine[]) => {
    for (const n of nodes) {
      if (n.type === 'ITEM' || n.type === 'SPREAD_ITEM') result.push(n)
      if (n.children.length > 0) walk(n.children)
    }
  }
  walk(lines)
  return result
}

const STATUS_COLORS: Record<ReportEntryStatus, string> = {
  PENDING: '#7b7f99',
  APPROVED: '#4caf78',
  IN_PAYMENT: '#f0a742',
  PAID: '#6c8cff',
}

const REPORT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Подан',
  APPROVED: 'Утверждён',
}

// ─── Форма добавления записи ────────────────────────────────────────────────

interface EntryFormProps {
  contractors: Contractor[]
  contracts: Contract[]
  taxSchemes: TaxScheme[]
  budgetItems: BudgetLine[]
  onSave: (data: EntryCreateData) => Promise<void>
  onCancel: () => void
  initial?: Partial<EntryCreateData>
}

const EMPTY_ENTRY: EntryCreateData = {
  contractor_id: '',
  budget_line_id: null,
  contract_id: null,
  shift_start: null,
  shift_end: null,
  lunch_break_minutes: 60,
  gap_minutes: 0,
  equipment: null,
  unit: 'смена',
  quantity: 1,
  rate: 0,
  tax_scheme_id: null,
}

const EntryForm: React.FC<EntryFormProps> = ({
  contractors, contracts, taxSchemes, budgetItems, onSave, onCancel, initial,
}) => {
  const [form, setForm] = useState<EntryCreateData>({ ...EMPTY_ENTRY, ...initial })
  const [saving, setSaving] = useState(false)

  // При выборе контрагента — автоналог из его карточки
  const handleContractorChange = (id: string) => {
    const ctr = contractors.find((c) => c.id === id)
    setForm((prev) => ({
      ...prev,
      contractor_id: id,
      tax_scheme_id: ctr?.tax_scheme_id ?? prev.tax_scheme_id,
    }))
  }

  // При выборе договора — подтягиваем налог договора
  const handleContractChange = (id: string) => {
    const c = contracts.find((c) => c.id === id)
    setForm((prev) => ({
      ...prev,
      contract_id: id || null,
      tax_scheme_id: id ? (c?.tax_scheme_id ?? prev.tax_scheme_id) : prev.tax_scheme_id,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contractor_id) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const filteredContracts = form.contractor_id
    ? contracts.filter((c) => c.contractor_id === form.contractor_id)
    : contracts

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Контрагент */}
        <div>
          <label style={labelStyle}>Контрагент *</label>
          <select
            className="input"
            required
            value={form.contractor_id}
            onChange={(e) => handleContractorChange(e.target.value)}
          >
            <option value="">— выберите —</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>

        {/* Договор */}
        <div>
          <label style={labelStyle}>Договор</label>
          <select
            className="input"
            value={form.contract_id || ''}
            onChange={(e) => handleContractChange(e.target.value)}
          >
            <option value="">— без договора —</option>
            {filteredContracts.map((c) => (
              <option key={c.id} value={c.id}>{c.number}</option>
            ))}
          </select>
        </div>

        {/* Статья бюджета */}
        <div>
          <label style={labelStyle}>Статья бюджета</label>
          <select
            className="input"
            value={form.budget_line_id || ''}
            onChange={(e) => setForm({ ...form, budget_line_id: e.target.value || null })}
          >
            <option value="">— не привязано —</option>
            {budgetItems.map((b) => (
              <option key={b.id} value={b.id}>{b.code} {b.name}</option>
            ))}
          </select>
        </div>

        {/* Единица измерения */}
        <div>
          <label style={labelStyle}>Ед.изм.</label>
          <select
            className="input"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            {['смена', 'час', 'день', 'км', 'шт', 'мес'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Начало смены */}
        <div>
          <label style={labelStyle}>Начало смены</label>
          <input
            className="input"
            type="time"
            value={form.shift_start || ''}
            onChange={(e) => setForm({ ...form, shift_start: e.target.value || null })}
          />
        </div>

        {/* Конец смены */}
        <div>
          <label style={labelStyle}>Конец смены</label>
          <input
            className="input"
            type="time"
            value={form.shift_end || ''}
            onChange={(e) => setForm({ ...form, shift_end: e.target.value || null })}
          />
        </div>

        {/* Обед (мин) */}
        <div>
          <label style={labelStyle}>Обед (мин)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.lunch_break_minutes}
            onChange={(e) => setForm({ ...form, lunch_break_minutes: +e.target.value })}
          />
        </div>

        {/* Разрыв (мин) */}
        <div>
          <label style={labelStyle}>Разрыв (мин)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.gap_minutes}
            onChange={(e) => setForm({ ...form, gap_minutes: +e.target.value })}
          />
        </div>

        {/* Ставка */}
        <div>
          <label style={labelStyle}>Ставка (нетто)</label>
          <input
            className="input"
            type="number"
            min={0}
            step={0.01}
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: +e.target.value })}
          />
        </div>

        {/* Кол-во */}
        <div>
          <label style={labelStyle}>Кол-во</label>
          <input
            className="input"
            type="number"
            min={0}
            step={0.5}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
          />
        </div>

        {/* Налоговая схема */}
        <div>
          <label style={labelStyle}>Налоговая схема</label>
          <select
            className="input"
            value={form.tax_scheme_id || ''}
            onChange={(e) => setForm({ ...form, tax_scheme_id: e.target.value || null })}
          >
            <option value="">— без налога —</option>
            {taxSchemes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Оборудование */}
        <div>
          <label style={labelStyle}>Оборудование</label>
          <input
            className="input"
            value={form.equipment || ''}
            onChange={(e) => setForm({ ...form, equipment: e.target.value || null })}
            placeholder="Ронин, Коптер, Авторобот"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={saving || !form.contractor_id}>
          {saving ? 'Сохранение...' : 'Добавить запись'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
}

// ─── Форма создания дня ─────────────────────────────────────────────────────

interface DayFormProps {
  projectId: string
  nextDayNumber: number
  onSave: (data: { shoot_day_number: number; date: string; location?: string; shooting_group?: string }) => Promise<void>
  onCancel: () => void
}

const DayForm: React.FC<DayFormProps> = ({ projectId, nextDayNumber, onSave, onCancel }) => {
  const today = new Date().toISOString().slice(0, 10)
  const [dayNum, setDayNum] = useState(nextDayNumber)
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')
  const [group, setGroup] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ shoot_day_number: dayNum, date, location: location || undefined, shooting_group: group || undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Съёмочный день №</label>
          <input
            className="input"
            type="number"
            min={1}
            value={dayNum}
            onChange={(e) => setDayNum(+e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Дата *</label>
          <input
            className="input"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Локация</label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Студия 5, ул. Примерная..."
          />
        </div>
        <div>
          <label style={labelStyle}>Съёмочная группа</label>
          <input
            className="input"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Основная группа"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Создание...' : 'Создать день'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  )
}

// ─── Главная страница ────────────────────────────────────────────────────────

export const ProductionPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [reports, setReports] = useState<ProductionReport[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [taxSchemes, setTaxSchemes] = useState<TaxScheme[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetLine[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedReport, setSelectedReport] = useState<ProductionReport | null>(null)
  const [showDayForm, setShowDayForm] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [reps, ctrs, conts, tax, tree] = await Promise.all([
        productionApi.listReports(projectId),
        contractorsApi.list(),
        contractsApi.list({ project_id: projectId }),
        taxSchemesApi.list(),
        budgetApi.getTree(projectId),
      ])
      setReports(reps)
      setContractors(ctrs)
      setContracts(conts)
      setTaxSchemes(tax)
      setBudgetItems(collectItems(tree))

      // Обновить выбранный отчёт
      if (selectedReport) {
        const updated = reps.find((r) => r.id === selectedReport.id)
        setSelectedReport(updated ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedReport?.id])

  useEffect(() => { load() }, [projectId])

  const handleCreateDay = async (data: any) => {
    if (!projectId) return
    const r = await productionApi.createReport(projectId, { ...data, project_id: projectId })
    await load()
    setShowDayForm(false)
    setSelectedReport(r)
  }

  const handleDeleteReport = async (r: ProductionReport) => {
    if (!confirm(`Удалить день №${r.shoot_day_number} (${r.date})?`)) return
    await productionApi.deleteReport(r.id)
    if (selectedReport?.id === r.id) setSelectedReport(null)
    await load()
  }

  const handleAddEntry = async (data: EntryCreateData) => {
    if (!selectedReport) return
    await productionApi.createEntry(selectedReport.id, data)
    setShowEntryForm(false)
    await load()
  }

  const handleDeleteEntry = async (entry: ReportEntry) => {
    if (!confirm(`Удалить запись для "${entry.contractor_name}"?`)) return
    await productionApi.deleteEntry(entry.id)
    await load()
  }

  const handleChangeEntryStatus = async (entry: ReportEntry, newStatus: ReportEntryStatus) => {
    await productionApi.updateEntry(entry.id, { status: newStatus })
    await load()
  }

  if (!projectId) return null

  const nextDayNumber = reports.length > 0
    ? Math.max(...reports.map((r) => r.shoot_day_number)) + 1
    : 1

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>

        {/* Подзаголовок с вкладками */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
            ← Проекты
          </button>
          <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
            <Link to={`/projects/${projectId}/budget`} style={tabStyle(false)}>Бюджет</Link>
            <Link to={`/projects/${projectId}/contracts`} style={tabStyle(false)}>Договоры</Link>
            <span style={tabStyle(true)}>Производство</span>
          </div>
        </div>

        {/* Тело — разделённый вид */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Левая панель: список дней */}
          <div style={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Съёмочные дни</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowDayForm(true)}
              >
                + День
              </button>
            </div>

            {/* Форма нового дня */}
            {showDayForm && (
              <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <DayForm
                  projectId={projectId}
                  nextDayNumber={nextDayNumber}
                  onSave={handleCreateDay}
                  onCancel={() => setShowDayForm(false)}
                />
              </div>
            )}

            {/* Список */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>Загрузка...</div>
              ) : reports.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Дней ещё нет.<br />Нажмите «+ День» для создания.
                </div>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      background: selectedReport?.id === r.id ? 'rgba(108,140,255,0.1)' : 'transparent',
                      borderLeft: selectedReport?.id === r.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        День #{r.shoot_day_number}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {REPORT_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {r.date}
                    </div>
                    {r.location && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.location}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {r.entry_count} записей
                      </span>
                      {r.total_gross > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--color-primary)' }}>
                          {fmt(r.total_gross)} ₽
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Правая панель: детализация выбранного дня */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {!selectedReport ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                Выберите день из списка слева
              </div>
            ) : (
              <>
                {/* Заголовок дня */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                      Съёмочный день #{selectedReport.shoot_day_number}
                    </h2>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4 }}>
                      {selectedReport.date}
                      {selectedReport.location && ` · ${selectedReport.location}`}
                      {selectedReport.shooting_group && ` · ${selectedReport.shooting_group}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowEntryForm(true)}
                    >
                      + Запись
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
                      onClick={() => handleDeleteReport(selectedReport)}
                    >
                      Удалить день
                    </button>
                  </div>
                </div>

                {/* Итоги */}
                {selectedReport.entries.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <div className="card" style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>ЗАПИСЕЙ</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedReport.entry_count}</div>
                    </div>
                    <div className="card" style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>НЕТТО</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(selectedReport.total_net)} ₽</div>
                    </div>
                    <div className="card" style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>БРУТТO</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>
                        {fmt(selectedReport.total_gross)} ₽
                      </div>
                    </div>
                  </div>
                )}

                {/* Форма добавления записи */}
                {showEntryForm && (
                  <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 14 }}>Новая запись</div>
                    <EntryForm
                      contractors={contractors}
                      contracts={contracts}
                      taxSchemes={taxSchemes}
                      budgetItems={budgetItems}
                      onSave={handleAddEntry}
                      onCancel={() => setShowEntryForm(false)}
                    />
                  </div>
                )}

                {/* Список записей */}
                {selectedReport.entries.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: 12 }}>
                      Записей нет. Добавьте первую запись о работе.
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowEntryForm(true)}>
                      + Добавить запись
                    </button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        {['Контрагент', 'Статья / Договор', 'Смена', 'Перераб.', 'Нетто', 'Брутто', 'Статус', ''].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.entries.map((entry) => (
                        <tr
                          key={entry.id}
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{entry.contractor_name}</td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: 12 }}>{entry.budget_line_name || '—'}</div>
                            {entry.contract_number && (
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                № {entry.contract_number}
                              </div>
                            )}
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {entry.shift_start && entry.shift_end
                              ? `${timeShort(entry.shift_start)}–${timeShort(entry.shift_end)}`
                              : `${entry.quantity} ${entry.unit}`
                            }
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {entry.overtime_hours > 0
                              ? <span style={{ color: 'var(--color-warning)' }}>{entry.overtime_hours}ч</span>
                              : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                            }
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            {fmt(entry.amount_net)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                            {fmt(entry.amount_gross)}
                          </td>
                          <td style={tdStyle}>
                            <select
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'var(--color-surface-2)',
                                border: `1px solid ${STATUS_COLORS[entry.status]}55`,
                                color: STATUS_COLORS[entry.status],
                                cursor: 'pointer',
                              }}
                              value={entry.status}
                              onChange={(e) => handleChangeEntryStatus(entry, e.target.value as ReportEntryStatus)}
                            >
                              {(Object.keys(REPORT_ENTRY_STATUS_LABELS) as ReportEntryStatus[]).map((s) => (
                                <option key={s} value={s}>{REPORT_ENTRY_STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)', fontSize: 11 }}
                              onClick={() => handleDeleteEntry(entry)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--color-text-muted)',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    background: active ? 'rgba(108,140,255,0.1)' : 'transparent',
    cursor: active ? 'default' : 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  }
}
