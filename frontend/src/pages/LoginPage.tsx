import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/projects')
    } catch {
      setError('Неверный email или пароль')
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-bg)',
    }}>
      <div className="card" style={{ width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
            YOMI Finance
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Управление финансами кинопроизводства
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 5 }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yomimovie.art"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 5 }}>
              Пароль
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: 'var(--color-danger)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ marginTop: 6, justifyContent: 'center' }}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
