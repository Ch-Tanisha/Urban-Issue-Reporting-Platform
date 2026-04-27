import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import CitizenHome    from './CitizenHome'
import ReportIssue   from './ReportIssue'
import MyReports      from './MyReports'
import CitizenProfile from './CitizenProfile'
import NotificationBell from '../../components/NotificationBell'
import ThemeToggle from '../../components/ThemeToggle'
import API from '../../api/axios'
import '../citizen/citizen.css'

const NAV = [
  { view:'home',    label:'Dashboard',    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { view:'report',  label:'Report Issue', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM11 17H7v-2h4v2zm6-4H7v-2h10v2z"/></svg> },
  { view:'reports', label:'My Reports',   icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6v14h16V6H4zm16-2a2 2 0 0 1 2 2v14c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h16zm-4 6H8v2h8V10zm-4 4H8v2h4v-2z"/></svg> },
  { view:'profile', label:'My Profile',   icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg> },
]

export default function CitizenDashboard() {
  const navigate = useNavigate()
  const [view, setView] = useState('home')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  // Read profile basics from the current session cache.
  const stored = JSON.parse(sessionStorage.getItem('uv_user') || '{}')
  const citizen = {
    name: stored.name || 'Citizen',
    email: stored.email || '',
    phone: stored.phone || '',
    address: stored.address || '',
    city: stored.city || '',
    zip: stored.pincode || '',
    block: stored.block || 'Block A',
    id: stored.id || ''
  }

  // Guard: only citizens are allowed on this dashboard.
  async function validateSessionRole() {
    try {
      const { data } = await API.get('/api/auth/me')
      if (data.role !== 'citizen') {
        sessionStorage.removeItem('uv_token')
        sessionStorage.removeItem('uv_role')
        sessionStorage.removeItem('uv_user')
        navigate('/auth')
      }
    } catch {
      sessionStorage.removeItem('uv_token')
      sessionStorage.removeItem('uv_role')
      sessionStorage.removeItem('uv_user')
      navigate('/auth')
    }
  }

  // Load issues reported by the logged-in citizen.
  async function fetchIssues() {
    try {
      setLoading(true)
      setError('')
      const { data } = await API.get('/api/issues/my')
      setIssues(data)
    } catch (err) {
      console.error('Failed to fetch issues:', err)
      setError('Could not load your issues. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Initial load: validate role, then fetch data.
  useEffect(() => {
    validateSessionRole()
    fetchIssues()
  }, [])

  // Create a new issue and refresh the reports view.
  async function addIssue(formData) {
    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description)
      fd.append('category', formData.category)
      fd.append('priority', formData.priority)
      fd.append('address', formData.address)
      fd.append('coordinates', formData.coordinates || '')
      fd.append('block', formData.block)
      fd.append('citizenContact', citizen.email)
      if (formData.image) {
        fd.append('photo', formData.image)
      }

      await API.post('/api/issues/create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      await fetchIssues()
      setView('reports')
    } catch (err) {
      console.error('Failed to create issue:', err)
      alert(err.response?.data?.message || 'Failed to create issue. Please try again.')
    }
  }

  // Delete an issue and update local state.
  async function deleteIssue(id) {
    try {
      await API.delete(`/api/issues/${id}`)
      setIssues(prev => prev.filter(i => i._id !== id))
    } catch (err) {
      console.error('Failed to delete issue:', err)
      alert(err.response?.data?.message || 'Failed to delete issue.')
    }
  }

  // View-to-component map used by sidebar navigation.
  const views = {
    home:    <CitizenHome    issues={issues} onNav={setView} citizen={citizen} loading={loading} />,
    report:  <ReportIssue   onSubmit={addIssue} onCancel={() => setView('home')} citizen={citizen} />,
    reports: <MyReports     issues={issues} onDelete={deleteIssue} onNew={() => setView('report')} onRefresh={fetchIssues} />,
    profile: <CitizenProfile citizen={citizen} />,
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="citizen"
        navItems={NAV}
        activeView={view}
        onNav={setView}
        userName={citizen.name}
        userRole={`Block: ${citizen.block}`}
        mobileOpen={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
      />
      <div className="main-content">
        <div className="top-bar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="hamburger-btn" onClick={() => setMobileMenu(true)}>☰</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ThemeToggle />
            <NotificationBell />
            <button className="btn-primary btn-sm" onClick={() => setView('report')}>+ New Report</button>
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
