import React, { useEffect, useState } from 'react'
import { AppLayout } from '../components/Layout/AppLayout'
import { contractorsApi } from '../api/contractors'
import type { Contractor, ContractorType } from '../types'
import { CONTRACTOR_TYPE_LABELS } from '../types'

const EMPTY_FORM = {
  full_name: '',
  type: 'FL' as ContractorType,
  inn: '',
  phone: '',
  email: '',
  currency: 'RUB',
}

export const ContractorsPage: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    contractorsApi.list().then(setContractors).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await contractorsApi.create({
        ...form,
        inn: form.inn || null,
        phone: form.phone || null,
        email: form.email || null,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch {
      alert('Ошибка создания контрагента')
    } finally {
      setSaving(false)
    }
  }

  const filtered = contractors.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.inn || '').includes(search)
  )

  return (
    <AppLayout>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Контрагенты</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Добавить</button>
        </div>

        <input
          className="input"
          style={{ maxWidth: 320, marginBottom: 16 }}
          placeholder="Поиск по имени или ИНН..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Новый контрагент</div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>ФИО / Название *</label>
                  <input
                    className="input"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Тип *</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ContractorType })}
                  >
                    {(Object.keys(CONTRACTOR_TYPE_LABELS) as ContractorType[]).map((t) => (
                      <option key={t} value={t}>{CONTRACTOR_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ИНН</label>
                  <input
                    className="input"
                    value={form.inn}
                    onChange={(e) => setForm({ ...form, inn: e.target.value })}
                    placeholder="123456789012"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Телефон</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+7 900 000-00-00"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ivan@example.com"
                  />
                </div>
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
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Создать'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
              {search ? 'Ничего не найдено' : 'Контрагентов пока нет'}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>Добавить первого</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['ФИО / Название', 'Тип', 'ИНН', 'Телефон', 'Email', 'Валюта'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={tdStyle}>{c.full_name}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle}>{CONTRACTOR_TYPE_LABELS[c.type]}</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {c.inn || '—'}
                    </td>
                    <td style={tdStyle}>{c.phone || '—'}</td>
                    <td style={tdStyle}>{c.email || '—'}</td>
                    <td style={tdStyle}>{c.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
  background: 'var(--color-surface-2)',
  color: 'var(--color-text-muted)',
}
