import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage        from './pages/LandingPage'
import AuthPage           from './pages/AuthPage'
import CitizenDashboard   from './pages/citizen/CitizenDashboard'
import OfficerDashboard   from './pages/blockofficer/OfficerDashboard'
import AdminDashboard     from './pages/admin/AdminDashboard'
import API from './api/axios'

// Guards a dashboard route so only logged-in users with the right role can access it.
// Uses sessionStorage (not localStorage) — each tab has its own independent session.
function ProtectedRoute({ children, role }) {
  const token = sessionStorage.getItem('uv_token')
  const stored = sessionStorage.getItem('uv_role')

  // Backend stores 'blockofficer' but the frontend uses 'officer' everywhere
  const normalizedStored = stored === 'blockofficer' ? 'officer' : stored

  // No active session — redirect to the login page
  if (!token || !normalizedStored) {
    return <Navigate to="/auth" replace />
  }

  // User is trying to access a dashboard that doesn't match their role.
  // Send them to their own dashboard instead of kicking them out.
  if (normalizedStored !== role) {
    const dashboardMap = { citizen: '/citizen', officer: '/officer', admin: '/admin' }
    return <Navigate to={dashboardMap[normalizedStored] || '/auth'} replace />
  }

  return children
}

export default function App() {
  // On every page load / refresh, verify the stored token is still valid.
  // If the server says the token is expired or the role doesn't match,
  // we clean up and send the user back to the login screen.
  useEffect(() => {
    async function validateSession() {
      const token = sessionStorage.getItem('uv_token')
      const storedRole = sessionStorage.getItem('uv_role')
      if (!token || !storedRole) return // nothing to validate

      try {
        const { data } = await API.get('/api/auth/me')
        const backendRole = data.role === 'blockofficer' ? 'officer' : data.role

        // If the token's role doesn't match what we saved, something is off
        if (backendRole !== storedRole) {
          sessionStorage.removeItem('uv_token')
          sessionStorage.removeItem('uv_user')
          sessionStorage.removeItem('uv_role')
          window.location.href = '/auth'
        }
      } catch {
        // Token is invalid or expired — clear everything
        sessionStorage.removeItem('uv_token')
        sessionStorage.removeItem('uv_user')
        sessionStorage.removeItem('uv_role')
      }
    }
    validateSession()
  }, [])

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

        {/* Anything else → back to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
