import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { path: '/projects', label: 'Проекты' },
  { path: '/contractors', label: 'Контрагенты' },
  { path: '/tax-schemes', label: 'Налоговые схемы' },
]

export const AppLayout: React.FC<Props> = ({ children }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Шапка */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: 52,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        gap: 32,
      }}>
        <Link to="/projects" style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-primary)', letterSpacing: -0.5 }}>
          YOMI Finance
        </Link>

        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                color: location.pathname.startsWith(item.path)
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
                background: location.pathname.startsWith(item.path)
                  ? 'rgba(108,140,255,0.1)'
                  : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {user?.full_name}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      {/* Контент */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
