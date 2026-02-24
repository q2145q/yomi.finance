import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi } from '@/api/projects'
import { budgetApi } from '@/api/budget'
import type { Project, BudgetCategory } from '@/types'
import BudgetTable from '@/components/BudgetTable/BudgetTable'
import AddLineModal from '@/components/BudgetTable/AddLineModal'
import ProjectParamsForm from '@/components/ProjectParams/ProjectParamsForm'
import toast from 'react-hot-toast'
import { Plus, Download, Lock, Settings, ArrowLeft } from 'lucide-react'

type Tab = 'budget' | 'params'

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('budget')
  const [showAddLine, setShowAddLine] = useState(false)
  const [savingLimit, setSavingLimit] = useState(false)

  const loadBudget = async () => {
    try {
      const [p, cats] = await Promise.all([
        projectsApi.get(projectId),
        budgetApi.get(projectId),
      ])
      setProject(p)
      setCategories(cats)
    } catch {
      toast.error('Ошибка загрузки бюджета')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBudget() }, [projectId])

  const handleSaveLimit = async () => {
    if (!confirm('Сохранить текущий план как Лимит? Предыдущий лимит будет перезаписан.')) return
    setSavingLimit(true)
    try {
      const result = await budgetApi.saveLimit(projectId)
      toast.success(`Лимит зафиксирован (${result.lines_updated} строк)`)
      loadBudget()
    } catch {
      toast.error('Ошибка фиксации лимита')
    } finally {
      setSavingLimit(false)
    }
  }

  if (loading) return <div className="page-loading">Загрузка бюджета...</div>
  if (!project) return <div className="page-loading">Проект не найден</div>

  return (
    <div className="budget-page">
      {/* Header */}
      <div className="budget-header">
        <div className="budget-header-left">
          <Link to="/" className="back-link"><ArrowLeft size={16} /> Проекты</Link>
          <h1 className="budget-title">{project.name}</h1>
        </div>
        <div className="budget-header-tabs">
          <button
            className={`tab-btn ${tab === 'budget' ? 'active' : ''}`}
            onClick={() => setTab('budget')}
          >
            Бюджет
          </button>
          <button
            className={`tab-btn ${tab === 'params' ? 'active' : ''}`}
            onClick={() => setTab('params')}
          >
            <Settings size={14} /> Параметры
          </button>
        </div>
        <div className="budget-header-actions">
          {tab === 'budget' && (
            <>
              <button className="btn-secondary" onClick={() => setShowAddLine(true)}>
                <Plus size={16} /> Добавить строку
              </button>
              <button
                className="btn-secondary"
                onClick={handleSaveLimit}
                disabled={savingLimit}
                title="Зафиксировать текущий план как Лимит"
              >
                <Lock size={16} />
                {savingLimit ? 'Сохранение...' : 'Сохранить как Лимит'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => budgetApi.exportXlsx(projectId)}
                title="Экспорт в Excel"
              >
                <Download size={16} /> Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {tab === 'budget' && (
        <BudgetTable
          projectId={projectId}
          categories={categories}
          onRefresh={loadBudget}
        />
      )}

      {tab === 'params' && (
        <div className="params-container">
          <ProjectParamsForm
            project={project}
            onSaved={(updated) => {
              setProject(updated)
              toast.success('Параметры обновлены')
            }}
          />
        </div>
      )}

      {/* Add line modal */}
      {showAddLine && (
        <AddLineModal
          projectId={projectId}
          categories={categories}
          onClose={() => setShowAddLine(false)}
          onSaved={() => {
            setShowAddLine(false)
            loadBudget()
          }}
        />
      )}
    </div>
  )
}
