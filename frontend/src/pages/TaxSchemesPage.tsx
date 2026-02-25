import React, { useEffect, useState } from 'react'
import { AppLayout } from '../components/Layout/AppLayout'
import { taxSchemesApi } from '../api/taxSchemes'
import type { TaxScheme } from '../types'

export const TaxSchemesPage: React.FC = () => {
  const [schemes, setSchemes] = useState<TaxScheme[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    taxSchemesApi.list().then(setSchemes).finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Налоговые схемы</h1>
        </div>

        <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
          Системные схемы создаются автоматически. Схема определяет расчёт налогов при добавлении строки в бюджет.
        </div>

        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
        ) : schemes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Схемы не найдены. Запустите seed для инициализации.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schemes.map((s) => (
              <div key={s.id} className="card" style={{ padding: 0 }}>
                {/* Заголовок схемы */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggle(s.id)}
                >
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
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
                </div>

                {/* Компоненты схемы */}
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
