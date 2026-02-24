import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LogOut, LayoutDashboard, Settings } from 'lucide-react'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">YOMI</span>
          <span className="logo-sub">Finance</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            <LayoutDashboard size={18} />
            Проекты
          </Link>
          <Link to="/settings" className="nav-link">
            <Settings size={18} />
            Настройки
          </Link>
        </nav>
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
