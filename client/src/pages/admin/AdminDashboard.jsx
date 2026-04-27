import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import AdminHome      from './AdminHome'
import AdminIssues    from './AdminIssues'
import AdminOfficers  from './AdminOfficers'
import AdminProfile   from './AdminProfile'
import NotificationBell from '../../components/NotificationBell'
import ThemeToggle from '../../components/ThemeToggle'
import API from '../../api/axios'
import './admin.css'

const NAV = [
  { view:'home',      label:'Dashboard',       icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { view:'issues',    label:'Reported Issues',  icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg> },
  { view:'officers',  label:'Block Officers',   icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  { view:'profile',   label:'My Profile',       icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg> },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [issues,   setIssues]   = useState([])
  const [view,     setView]     = useState('home')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  // Read the cached user info so the UI can show the name immediately,
  // then overwrite it with fresh data from the server.
  const storedUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('uv_user') || '{}') } catch { return {} }
  })()

  const [adminName, setAdminName] = useState(storedUser.name || '')
  const [adminEmail, setAdminEmail] = useState(storedUser.email || '')
  const [adminPhone, setAdminPhone] = useState(storedUser.phone || '')

  // Verify that the logged-in user really is an admin
  useEffect(() => {
    async function fetchAdminProfile() {
      try {
        const { data } = await API.get('/api/auth/me')
        if (data.role !== 'admin') {
          sessionStorage.removeItem('uv_token')
          sessionStorage.removeItem('uv_user')
          sessionStorage.removeItem('uv_role')
          navigate('/auth')
          return
        }
        setAdminName(data.name  || storedUser.name  || 'Admin')
        setAdminEmail(data.email || storedUser.email || '')
        setAdminPhone(data.phone || storedUser.phone || '')
        // Keep the cached copy in sync
        sessionStorage.setItem('uv_user', JSON.stringify({
          ...storedUser,
          id:    data._id,
          name:  data.name,
          email: data.email,
          role:  data.role,
          phone: data.phone
        }))
      } catch (err) {
        console.error('Failed to fetch admin profile:', err)
        setError('Session expired or invalid. Please log in again.')
        sessionStorage.removeItem('uv_token')
        sessionStorage.removeItem('uv_user')
        sessionStorage.removeItem('uv_role')
        navigate('/auth')
      }
    }
    fetchAdminProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load all issues from the platform
  async function fetchIssues() {
    try {
      setLoading(true)
      setError('')
      const { data } = await API.get('/api/issues/all')
      setIssues(data)
    } catch (err) {
      console.error('Failed to fetch issues:', err)
      setError('Could not load issues. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIssues() }, [])

  async function resolveIssue(id) {
    try {
      await API.put(`/api/issues/${id}/status`, { status: 'Resolved' })
      setIssues(prev => prev.map(i => i._id === id ? { ...i, status:'Resolved' } : i))
    } catch (err) {
      console.error('Resolve failed:', err)
    }
  }

  async function deleteIssue(id) {
    try {
      await API.delete(`/api/issues/${id}`)
      setIssues(prev => prev.filter(i => i._id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert(err.response?.data?.message || 'Failed to delete issue')
    }
  }

  async function updateStatus(id, status) {
    try {
      await API.put(`/api/issues/${id}/status`, { status })
      setIssues(prev => prev.map(i => i._id === id ? { ...i, status } : i))
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  // Map each sidebar nav item to its content component
  const views = {
    home:      <AdminHome      issues={issues} loading={loading} adminName={adminName} onNav={setView} />,
    issues:    <AdminIssues    issues={issues} onResolve={resolveIssue} onDelete={deleteIssue} onStatus={updateStatus} />,
    officers:  <AdminOfficers />,
    profile:   <AdminProfile   adminName={adminName} adminEmail={adminEmail} adminPhone={adminPhone} />,
  }

  return (
    <div className="dashboard-wrapper admin-theme">
      <Sidebar
        role="admin"
        navItems={NAV}
        activeView={view}
        onNav={setView}
        userName={adminName || 'Admin'}
        userRole="System Administrator"
        mobileOpen={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
      />
      <div className="main-content">
        <div className="top-bar admin-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="hamburger-btn" onClick={() => setMobileMenu(true)}>☰</button>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <ThemeToggle />
            <NotificationBell />
            <div className="admin-topbar-badge">🛡 Admin</div>
          </div>
        </div>
        <div className="page-content animate-fadeIn">
          {error && (
            <div style={{ background:'#fef2f2', color:'#dc2626', padding:'14px 20px', borderRadius:12, marginBottom:20, fontWeight:600, fontSize:'0.9rem', border:'1px solid #fecaca' }}>
              ⚠️ {error}
              <button onClick={fetchIssues} style={{ marginLeft:12, background:'none', border:'1px solid #dc2626', borderRadius:8, padding:'4px 12px', color:'#dc2626', cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>Retry</button>
            </div>
          )}
          {views[view]}
        </div>
      </div>
    </div>
  )
}
