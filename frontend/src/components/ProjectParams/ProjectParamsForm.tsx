import { useEffect, useState } from 'react'
import { projectsApi } from '@/api/projects'
import type { Project } from '@/types'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

interface Props {
  project: Project
  onSaved: (updated: Project) => void
}

const PARAM_LABELS: Record<string, string> = {
  vat_rate: 'Ставка НДС по умолчанию, %',
  sz_rate: 'Ставка СЗ по умолчанию, %',
  km_rate: 'Норм. ставка км (руб/км)',
  shift_hours: 'Длина смены (часов)',
}

export default function ProjectParamsForm({ project, onSaved }: Props) {
  const [name, setName] = useState(project.name)
  const [startDate, setStartDate] = useState(project.start_date || '')
  const [endDate, setEndDate] = useState(project.end_date || '')
  const [currency, setCurrency] = useState(project.currency)
  const [params, setParams] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    project.params.forEach((p) => { m[p.key] = p.value })
    return m
  })
  const [saving, setSaving] = useState(false)

  const setParam = (key: string, value: string) =>
    setParams((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await projectsApi.update(project.id, {
        name,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        currency,
        params,
      })
      onSaved(updated)
      toast.success('Параметры сохранены')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="params-form" onSubmit={handleSave}>
      <h2>Параметры проекта</h2>

      <div className="form-section">
        <h3>Основное</h3>
        <div className="form-group">
          <label>Название проекта</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Дата начала</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Дата окончания</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Валюта</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}>
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Налоги и нормативы</h3>
        {Object.entries(PARAM_LABELS).map(([key, label]) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <input
              type="number"
              value={params[key] ?? ''}
              onChange={(e) => setParam(key, e.target.value)}
              step="0.01"
            />
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving}>
          <Save size={16} />
          {saving ? 'Сохранение...' : 'Сохранить параметры'}
        </button>
      </div>
    </form>
  )
}
