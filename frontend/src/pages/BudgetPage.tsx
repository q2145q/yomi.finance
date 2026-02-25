import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/Layout/AppLayout'
import { BudgetTable } from '../components/BudgetTable/BudgetTable'
import { budgetApi } from '../api/budget'
import { projectsApi } from '../api/projects'
import type { BudgetLine, Project } from '../types'

export const BudgetPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [tree, setTree] = useState<BudgetLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!projectId) return
    try {
      const [proj, budget] = await Promise.all([
        projectsApi.get(projectId),
        budgetApi.getTree(projectId),
      ])
      setProject(proj)
      setTree(budget)
    } catch {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  if (!projectId) return null

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
        {/* Подзаголовок */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/projects')}
          >
            ← Проекты
          </button>
          <span style={{ fontWeight: 600 }}>{project?.name || '...'}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>→ Бюджет</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-muted)' }}>
            Загрузка бюджета...
          </div>
        ) : error ? (
          <div style={{ padding: 40, color: 'var(--color-danger)' }}>{error}</div>
        ) : tree.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Бюджет пустой</div>
            <button
              className="btn btn-primary"
              onClick={() => budgetApi.loadTemplate(projectId).then(loadData)}
            >
              Загрузить стандартный шаблон
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <BudgetTable projectId={projectId} tree={tree} onUpdate={loadData} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
