import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { BudgetPage } from './pages/BudgetPage'
import { ContractorsPage } from './pages/ContractorsPage'
import { TaxSchemesPage } from './pages/TaxSchemesPage'
import { ContractsPage } from './pages/ContractsPage'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App: React.FC = () => {
  const { loadMe } = useAuthStore()

  useEffect(() => {
    loadMe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/projects"
          element={<PrivateRoute><ProjectsPage /></PrivateRoute>}
        />
        <Route
          path="/projects/:projectId/budget"
          element={<PrivateRoute><BudgetPage /></PrivateRoute>}
        />
        <Route
          path="/projects/:projectId/contracts"
          element={<PrivateRoute><ContractsPage /></PrivateRoute>}
        />
        <Route
          path="/contractors"
          element={<PrivateRoute><ContractorsPage /></PrivateRoute>}
        />
        <Route
          path="/tax-schemes"
          element={<PrivateRoute><TaxSchemesPage /></PrivateRoute>}
        />
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
