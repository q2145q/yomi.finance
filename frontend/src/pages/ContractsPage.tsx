import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AppLayout } from '../components/Layout/AppLayout'
import { contractsApi, type ContractCreateData } from '../api/contracts'
import { contractorsApi } from '../api/contractors'
import { taxSchemesApi } from '../api/taxSchemes'
import { budgetApi } from '../api/budget'
import type {
  Contract,
  ContractPaymentType,
  ContractStatus,
  Contractor,
  TaxScheme,
  BudgetLine,
} from '../types'
import {
  CONTRACT_PAYMENT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
} from '../types'

const PAYMENT_PERIODS: { value: string; label: string }[] = [
  { value: 'monthly', label: 'Ежемесячно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'biweekly', label: 'Раз в две недели' },
  { value: 'on_completion', label: 'По завершении' },
]

const EMPTY_FORM: ContractCreateData = {
  number: '',
  project_id: '',
  contractor_id: '',
  payment_type: 'SALARY',
  payment_period: null,
  currency: 'RUB',
  status: 'DRAFT',
  signed_at: null,
  valid_from: null,
  valid_to: null,
  tax_scheme_id: null,
  tax_override: false,
  notes: null,
  budget_line_ids: [],
}

// Получить все статьи (листья) из дерева бюджета
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

const STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: '#7b7f99',
  ACTIVE: '#4caf78',
  CLOSED: '#e05c5c',
}

export const ContractsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [taxSchemes, setTaxSchemes] = useState<TaxScheme[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetLine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ContractCreateData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [projectName, setProjectName] = useState('')

  const load = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      contractsApi.list({ project_id: projectId }),
      contractorsApi.list(),
      taxSchemesApi.list(),
      budgetApi.getTree(projectId),
    ])
      .then(([c, ctr, tax, tree]) => {
        setContracts(c)
        setContractors(ctr)
        setTaxSchemes(tax)
        setBudgetItems(collectItems(tree))
      })
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  // При выборе контрагента — автоподтягиваем налог.схему
  const handleContractorChange = (contractorId: string) => {
    const ctr = contractors.find((c) => c.id === contractorId)
    setForm((prev) => ({
      ...prev,
      contractor_id: contractorId,
      tax_scheme_id: prev.tax_override ? prev.tax_scheme_id : (ctr?.tax_scheme_id ?? null),
    }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, project_id: projectId! })
    setShowForm(true)
  }

  const openEdit = (c: Contract) => {
    setEditingId(c.id)
    setForm({
      number: c.number,
      project_id: c.project_id,
      contractor_id: c.contractor_id,
      payment_type: c.payment_type,
      payment_period: c.payment_period,
      currency: c.currency,
      status: c.status,
      signed_at: c.signed_at,
      valid_from: c.valid_from,
      valid_to: c.valid_to,
      tax_scheme_id: c.tax_scheme_id,
      tax_override: c.tax_override,
      notes: c.notes,
      budget_line_ids: c.budget_line_ids,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.number.trim() || !form.contractor_id) {
      alert('Заполните номер договора и выберите контрагента')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await contractsApi.update(editingId, form)
      } else {
        await contractsApi.create(form)
      }
      setShowForm(false)
      setEditingId(null)
      load()
    } catch {
      alert(editingId ? 'Ошибка обновления' : 'Ошибка создания договора')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Удалить договор "${number}"?`)) return
    try {
      await contractsApi.delete(id)
      load()
    } catch {
      alert('Ошибка удаления договора')
    }
  }

  const toggleBudgetLine = (lineId: string) => {
    setForm((prev) => ({
      ...prev,
      budget_line_ids: prev.budget_line_ids?.includes(lineId)
        ? prev.budget_line_ids.filter((id) => id !== lineId)
        : [...(prev.budget_line_ids || []), lineId],
    }))
  }

  if (!projectId) return null

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 52px)' }}>
        {/* Подзаголовок проекта */}
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
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 }}>
            {projectId.slice(0, 8)}…
          </span>

          {/* Вкладки проекта */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
            <Link
              to={`/projects/${projectId}/budget`}
              style={tabStyle(false)}
            >
              Бюджет
            </Link>
            <span style={tabStyle(true)}>Договоры</span>
          </div>
        </div>

        {/* Контент */}
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Договоры</h1>
            <button className="btn btn-primary" onClick={openCreate}>+ Добавить договор</button>
          </div>

          {/* Форма */}
          {showForm && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>
                {editingId ? 'Редактировать договор' : 'Новый договор'}
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {/* Номер */}
                  <div>
                    <label style={labelStyle}>Номер договора *</label>
                    <input
                      className="input"
                      required
                      autoFocus
                      value={form.number}
                      onChange={(e) => setForm({ ...form, number: e.target.value })}
                      placeholder="№ 25/2026"
                    />
                  </div>

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

                  {/* Тип оплаты */}
                  <div>
                    <label style={labelStyle}>Тип оплаты *</label>
                    <select
                      className="input"
                      value={form.payment_type}
                      onChange={(e) => setForm({ ...form, payment_type: e.target.value as ContractPaymentType })}
                    >
                      {(Object.keys(CONTRACT_PAYMENT_TYPE_LABELS) as ContractPaymentType[]).map((t) => (
                        <option key={t} value={t}>{CONTRACT_PAYMENT_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Периодичность выплат */}
                  <div>
                    <label style={labelStyle}>Периодичность выплат</label>
                    <select
                      className="input"
                      value={form.payment_period || ''}
                      onChange={(e) => setForm({ ...form, payment_period: e.target.value || null })}
                    >
                      <option value="">— не указана —</option>
                      {PAYMENT_PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Статус */}
                  <div>
                    <label style={labelStyle}>Статус</label>
                    <select
                      className="input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as ContractStatus })}
                    >
                      {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map((s) => (
                        <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Валюта */}
                  <div>
                    <label style={labelStyle}>Валюта</label>
                    <select
                      className="input"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      <option value="RUB">RUB — Рубль</option>
                      <option value="USD">USD — Доллар</option>
                      <option value="EUR">EUR — Евро</option>
                    </select>
                  </div>

                  {/* Дата подписания */}
                  <div>
                    <label style={labelStyle}>Дата подписания</label>
                    <input
                      className="input"
                      type="date"
                      value={form.signed_at || ''}
                      onChange={(e) => setForm({ ...form, signed_at: e.target.value || null })}
                    />
                  </div>

                  {/* Действует с */}
                  <div>
                    <label style={labelStyle}>Действует с</label>
                    <input
                      className="input"
                      type="date"
                      value={form.valid_from || ''}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value || null })}
                    />
                  </div>

                  {/* Действует по */}
                  <div>
                    <label style={labelStyle}>Действует по</label>
                    <input
                      className="input"
                      type="date"
                      value={form.valid_to || ''}
                      onChange={(e) => setForm({ ...form, valid_to: e.target.value || null })}
                    />
                  </div>

                  {/* Налоговая схема */}
                  <div>
                    <label style={labelStyle}>
                      Налоговая схема
                      {form.tax_override && (
                        <span style={{ marginLeft: 6, color: 'var(--color-warning)', fontSize: 10 }}>
                          ручное
                        </span>
                      )}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        className="input"
                        value={form.tax_scheme_id || ''}
                        onChange={(e) => setForm({
                          ...form,
                          tax_scheme_id: e.target.value || null,
                          tax_override: true,
                        })}
                      >
                        <option value="">— не выбрана —</option>
                        {taxSchemes.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {form.tax_override && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Сбросить к налогу контрагента"
                          onClick={() => {
                            const ctr = contractors.find((c) => c.id === form.contractor_id)
                            setForm({
                              ...form,
                              tax_scheme_id: ctr?.tax_scheme_id ?? null,
                              tax_override: false,
                            })
                          }}
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Заметки */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Заметки</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
                    placeholder="Дополнительная информация..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Привязка к статьям бюджета */}
                {budgetItems.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>
                      Статьи бюджета ({form.budget_line_ids?.length || 0} выбрано)
                    </label>
                    <div style={{
                      maxHeight: 160,
                      overflowY: 'auto',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      padding: '4px 0',
                    }}>
                      {budgetItems.map((item) => (
                        <label
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '5px 12px',
                            cursor: 'pointer',
                            background: form.budget_line_ids?.includes(item.id)
                              ? 'rgba(108,140,255,0.08)'
                              : 'transparent',
                            fontSize: 13,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.budget_line_ids?.includes(item.id) || false}
                            onChange={() => toggleBudgetLine(item.id)}
                          />
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 11, minWidth: 70 }}>
                            {item.code}
                          </span>
                          <span>{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null) }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Список договоров */}
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
          ) : contracts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Договоров пока нет
              </div>
              <button className="btn btn-primary" onClick={openCreate}>Добавить первый</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Номер', 'Контрагент', 'Тип оплаты', 'Статус', 'Действует', 'Налог. схема', 'Статей', ''].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => {
                    const schemeName = taxSchemes.find((s) => s.id === c.tax_scheme_id)?.name
                    const validRange = [c.valid_from, c.valid_to].filter(Boolean).join(' — ') || '—'
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{c.number}</td>
                        <td style={tdStyle}>{c.contractor_name}</td>
                        <td style={tdStyle}>
                          <span style={tagStyle}>{CONTRACT_PAYMENT_TYPE_LABELS[c.payment_type]}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            ...tagStyle,
                            color: STATUS_COLORS[c.status],
                            borderColor: STATUS_COLORS[c.status] + '55',
                          }}>
                            {CONTRACT_STATUS_LABELS[c.status]}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: 12 }}>
                          {validRange}
                        </td>
                        <td style={tdStyle}>
                          {schemeName
                            ? <span>{schemeName}{c.tax_override && <span style={{ color: 'var(--color-warning)', marginLeft: 4 }}>✱</span>}</span>
                            : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                          }
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {c.budget_line_ids.length > 0
                            ? <span style={{ color: 'var(--color-primary)' }}>{c.budget_line_ids.length}</span>
                            : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                          }
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                              Изменить
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
                              onClick={() => handleDelete(c.id, c.number)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
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

const tagStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
  background: 'var(--color-surface-2)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
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
