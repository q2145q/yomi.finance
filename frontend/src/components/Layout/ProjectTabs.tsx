import React from 'react'
import { Link } from 'react-router-dom'

type TabKey = 'budget' | 'contracts' | 'production'

interface Props {
  projectId: string
  active: TabKey
}

const TABS: { key: TabKey; label: string; path: (id: string) => string }[] = [
  { key: 'budget', label: 'Бюджет', path: (id) => `/projects/${id}/budget` },
  { key: 'contracts', label: 'Договоры', path: (id) => `/projects/${id}/contracts` },
  { key: 'production', label: 'Производство', path: (id) => `/projects/${id}/production` },
]

export const ProjectTabs: React.FC<Props> = ({ projectId, active }) => (
  <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
    {TABS.map((tab) =>
      tab.key === active ? (
        <span
          key={tab.key}
          style={{
            padding: '4px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-primary)',
            background: 'rgba(108,140,255,0.1)',
          }}
        >
          {tab.label}
        </span>
      ) : (
        <Link
          key={tab.key}
          to={tab.path(projectId)}
          style={{
            padding: '4px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
          }}
        >
          {tab.label}
        </Link>
      )
    )}
  </div>
)
