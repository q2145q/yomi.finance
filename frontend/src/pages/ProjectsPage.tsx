import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '@/api/projects'
import type { Project } from '@/types'
import toast from 'react-hot-toast'
import { Plus, FolderOpen, Trash2 } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    try {
      setProjects(await projectsApi.list())
    } catch {
      toast.error('Не удалось загрузить проекты')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      const p = await projectsApi.create({ name: newName.trim() })
      setProjects((prev) => [...prev, p])
      setNewName('')
      setCreating(false)
      toast.success('Проект создан')
    } catch {
      toast.error('Ошибка создания проекта')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить проект? Это действие необратимо.')) return
    try {
      await projectsApi.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Проект удалён')
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  if (loading) return <div className="page-loading">Загрузка...</div>

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>Проекты</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Новый проект
        </button>
      </div>

      {creating && (
        <form className="create-project-form" onSubmit={handleCreate}>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название проекта"
          />
          <button type="submit" className="btn-primary">Создать</button>
          <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>Отмена</button>
        </form>
      )}

      <div className="projects-grid">
        {projects.map((p) => (
          <div key={p.id} className="project-card">
            <div className="project-card-body" onClick={() => navigate(`/projects/${p.id}`)}>
              <FolderOpen size={32} className="project-icon" />
              <div className="project-name">{p.name}</div>
              <div className="project-meta">
                {p.currency}
                {p.start_date && ` · ${p.start_date}`}
              </div>
            </div>
            <div className="project-card-actions">
              <button
                className="btn-icon danger"
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                title="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="empty-state">Нет проектов. Создайте первый!</p>
        )}
      </div>
    </div>
  )
}
