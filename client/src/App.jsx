import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage        from './pages/LandingPage'
import AuthPage           from './pages/AuthPage'
import CitizenDashboard   from './pages/citizen/CitizenDashboard'
import OfficerDashboard   from './pages/blockofficer/OfficerDashboard'
import AdminDashboard     from './pages/admin/AdminDashboard'

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('uv_token')
  const stored = localStorage.getItem('uv_role')
  // Normalize: backend 'blockofficer' is stored as 'officer' in frontend
  const normalizedStored = stored === 'blockofficer' ? 'officer' : stored
  if (!token || !normalizedStored || normalizedStored !== role) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<LandingPage />} />
        <Route path="/auth"   element={<AuthPage />} />

        <Route path="/citizen/*" element={
          <ProtectedRoute role="citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        } />

        <Route path="/officer/*" element={
          <ProtectedRoute role="officer">
            <OfficerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
