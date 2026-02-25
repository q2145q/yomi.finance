import React, { useEffect, useState } from 'react'
import { AppLayout } from '../components/Layout/AppLayout'
import { taxSchemesApi } from '../api/taxSchemes'
import type { TaxComponentInput } from '../api/taxSchemes'
import type { TaxScheme } from '../types'

const EMPTY_COMPONENT: TaxComponentInput = {
  name: '',
  rate: 0,
  type: 'EXTERNAL',
  recipient: 'BUDGET',
  sort_order: 0,
}

export const TaxSchemesPage: React.FC = () => {
  const [schemes, setSchemes] = useState<TaxScheme[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [schemeName, setSchemeName] = useState('')
  const [components, setComponents] = useState<TaxComponentInput[]>([{ ...EMPTY_COMPONENT }])
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    taxSchemesApi.list().then(setSchemes).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async (scheme: TaxScheme) => {
    if (!confirm(`Удалить схему "${scheme.name}"?`)) return
    try {
      await taxSchemesApi.delete(scheme.id)
      load()
    } catch {
      alert('Ошибка удаления. Схема может использоваться в бюджете.')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schemeName.trim()) return
    setSaving(true)
    try {
      await taxSchemesApi.create({
        name: schemeName.trim(),
        components: components.map((c, i) => ({ ...c, sort_order: i, rate: Number(c.rate) })),
      })
      setSchemeName('')
      setComponents([{ ...EMPTY_COMPONENT }])
      setShowForm(false)
      load()
    } catch {
      alert('Ошибка создания схемы. Возможно, имя уже используется.')
    } finally {
      setSaving(false)
    }
  }

  const updateComp = (i: number, field: keyof TaxComponentInput, value: string | number) => {
    setComponents((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const addComp = () => setComponents((prev) => [...prev, { ...EMPTY_COMPONENT }])
  const removeComp = (i: number) => setComponents((prev) => prev.filter((_, idx) => idx !== i))

  const TYPE_LABELS: Record<string, string> = {
    INTERNAL: 'Внутри (из суммы)',
    EXTERNAL: 'Сверху',
  }
  const RECIPIENT_LABELS: Record<string, string> = {
    CONTRACTOR: 'Контрагенту',
    BUDGET: 'В бюджет',
  }

  return (
    <AppLayout>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Налоговые схемы</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Создать схему</button>
        </div>

        <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
          Системные схемы создаются автоматически и не могут быть удалены. Назначьте схему контрагенту или статье бюджета для автоматического расчёта налогов.
        </div>

        {/* Форма создания схемы */}
        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Новая налоговая схема</div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Название схемы *</label>
                <input
                  className="input"
                  style={{ maxWidth: 360 }}
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder="Например: ИП УСН 6%"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Компоненты налога</div>
                {components.map((comp, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                    <div>
                      {i === 0 && <label style={labelStyle}>Название</label>}
                      <input
                        className="input"
                        required
                        value={comp.name}
                        onChange={(e) => updateComp(i, 'name', e.target.value)}
                        placeholder="Например: НДС"
                      />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>Ставка %</label>}
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        required
                        value={comp.rate}
                        onChange={(e) => updateComp(i, 'rate', e.target.value)}
                        placeholder="20"
                      />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>Тип</label>}
                      <select
                        className="input"
                        value={comp.type}
                        onChange={(e) => updateComp(i, 'type', e.target.value)}
                      >
                        <option value="EXTERNAL">Сверху (сверх суммы)</option>
                        <option value="INTERNAL">Внутри (из суммы)</option>
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>Получатель</label>}
                      <select
                        className="input"
                        value={comp.recipient}
                        onChange={(e) => updateComp(i, 'recipient', e.target.value)}
                      >
                        <option value="BUDGET">В бюджет</option>
                        <option value="CONTRACTOR">Контрагенту</option>
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>&nbsp;</label>}
                      {components.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
                          onClick={() => removeComp(i)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addComp} style={{ marginTop: 4 }}>
                  + Добавить компонент
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Создание...' : 'Создать'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setSchemeName(''); setComponents([{ ...EMPTY_COMPONENT }]) }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
        ) : schemes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Схемы не найдены. Запустите seed для инициализации системных схем.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schemes.map((s) => (
              <div key={s.id} className="card" style={{ padding: 0 }}>
                {/* Заголовок схемы */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer' }}
                  onClick={() => toggle(s.id)}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {expanded.has(s.id) ? '▼' : '▶'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                  {s.is_system && (
                    <span style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(108,140,255,0.15)',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                    }}>
                      Системная
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {s.components.length} {s.components.length === 1 ? 'компонент' : 'компонентов'}
                  </span>
                  {!s.is_system && (
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(s) }}
                    >
                      Удалить
                    </button>
                  )}
                </div>

                {/* Компоненты */}
                {expanded.has(s.id) && s.components.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          {['Название', 'Ставка', 'Тип', 'Получатель'].map((h) => (
                            <th key={h} style={{
                              textAlign: 'left',
                              padding: '8px 18px',
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              fontWeight: 600,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...s.components].sort((a, b) => a.sort_order - b.sort_order).map((comp) => (
                          <tr key={comp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '10px 18px' }}>{comp.name}</td>
                            <td style={{ padding: '10px 18px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {(comp.rate * 100).toFixed(0)}%
                            </td>
                            <td style={{ padding: '10px 18px' }}>
                              <span style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: comp.type === 'INTERNAL' ? 'rgba(255,170,51,0.15)' : 'rgba(108,140,255,0.12)',
                                color: comp.type === 'INTERNAL' ? '#ffaa33' : 'var(--color-primary)',
                              }}>
                                {TYPE_LABELS[comp.type] || comp.type}
                              </span>
                            </td>
                            <td style={{ padding: '10px 18px', color: 'var(--color-text-muted)' }}>
                              {RECIPIENT_LABELS[comp.recipient] || comp.recipient}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}
