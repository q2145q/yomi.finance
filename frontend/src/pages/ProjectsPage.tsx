import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import { AppLayout } from '../components/Layout/AppLayout'
import type { Project } from '../types'
import { PROJECT_STATUS_LABELS } from '../types'

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    projectsApi.list().then(setProjects).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      const p = await projectsApi.create({ name: newName.trim() })
      setProjects((prev) => [p, ...prev])
      setNewName('')
      setCreating(false)
    } catch {
      alert('Ошибка создания проекта')
    }
  }

  return (
    <AppLayout>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Проекты</h1>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            + Новый проект
          </button>
        </div>

        {creating && (
          <div className="card" style={{ marginBottom: 20 }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Название проекта"
                autoFocus
              />
              <button className="btn btn-primary" type="submit">Создать</button>
              <button className="btn btn-secondary" type="button" onClick={() => setCreating(false)}>Отмена</button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>У вас пока нет проектов</div>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>Создать первый проект</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                onClick={() => navigate(`/projects/${p.id}/budget`)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                  }}>
                    {PROJECT_STATUS_LABELS[p.status]}
                  </span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                  }}>
                    {p.currency_primary}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
                  {new Date(p.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
