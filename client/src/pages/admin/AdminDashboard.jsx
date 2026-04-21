import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import AdminHome      from './AdminHome'
import AdminIssues    from './AdminIssues'
import AdminOfficers  from './AdminOfficers'
import AdminAnalytics from './AdminAnalytics'
import NotificationBell from '../../components/NotificationBell'
import API from '../../api/axios'
import './admin.css'

const NAV = [
  { view:'home',      label:'Dashboard',       icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { view:'issues',    label:'Reported Issues',  icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg> },
  { view:'officers',  label:'Block Officers',   icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  { view:'analytics', label:'Analytics',        icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
]

export default function AdminDashboard() {
  const [issues, setIssues] = useState([])
  const [view, setView]     = useState('home')
  const [loading, setLoading] = useState(true)

  // Fetch all issues from backend
  async function fetchIssues() {
    try {
      setLoading(true)
      const { data } = await API.get('/api/issues/all')
      setIssues(data)
    } catch (err) {
      console.error('Failed to fetch issues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [])

  // Resolve issue via API
  async function resolveIssue(id) {
    try {
      await API.put(`/api/issues/${id}/status`, { status: 'Resolved' })
      setIssues(prev => prev.map(i => i._id === id ? { ...i, status:'Resolved' } : i))
    } catch (err) {
      console.error('Resolve failed:', err)
    }
  }

  // Delete issue via API
  async function deleteIssue(id) {
    try {
      await API.delete(`/api/issues/${id}`)
      setIssues(prev => prev.filter(i => i._id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert(err.response?.data?.message || 'Failed to delete issue')
    }
  }

  // Update status via API
  async function updateStatus(id, status) {
    try {
      await API.put(`/api/issues/${id}/status`, { status })
      setIssues(prev => prev.map(i => i._id === id ? { ...i, status } : i))
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  const views = {
    home:      <AdminHome      issues={issues} loading={loading} />,
    issues:    <AdminIssues    issues={issues} onResolve={resolveIssue} onDelete={deleteIssue} onStatus={updateStatus} />,
    officers:  <AdminOfficers />,
    analytics: <AdminAnalytics issues={issues} />,
  }

  return (
    <div className="dashboard-wrapper admin-theme">
      <Sidebar
        role="admin"
        navItems={NAV}
        activeView={view}
        onNav={setView}
        userName="Administrator"
        userRole="System Admin"
      />
      <div className="main-content">
        <div className="top-bar admin-topbar">
          <div>
            <div className="top-bar-title">{NAV.find(n=>n.view===view)?.label}</div>
            <div className="top-bar-sub">UrbanVoice Admin Control Panel</div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <NotificationBell />
            <div className="admin-topbar-badge">🛡 Admin</div>
          </div>
        </div>
        <div className="page-content animate-fadeIn" style={{ background:'#f8fafc' }}>
          {views[view]}
        </div>
      </div>
    </div>
  )
}
