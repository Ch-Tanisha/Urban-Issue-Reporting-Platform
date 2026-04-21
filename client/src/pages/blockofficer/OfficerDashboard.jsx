import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import OfficerHome      from './OfficerHome'
import OfficerMyIssues  from './OfficerMyIssues'
import OfficerAnalytics from './OfficerAnalytics'
import OfficerProfile   from './OfficerProfile'
import NotificationBell from '../../components/NotificationBell'
import API from '../../api/axios'
import './officer.css'

const NAV = [
  { view:'home',      label:'Dashboard',       icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { view:'myissues',  label:'My Issues',        icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6v14h16V6H4zm14-2H6l-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-2zm-2 10H8v-2h8v2zm0-4H8v-2h8v2z"/></svg> },
  { view:'analytics', label:'Block Analytics',  icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
  { view:'profile',   label:'My Profile',       icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg> },
]

export default function OfficerDashboard() {
  const stored = JSON.parse(localStorage.getItem('uv_user') || '{}')
  const [officer, setOfficer] = useState({
    name: stored.name || 'Officer',
    email: stored.email || '',
    phone: stored.phone || '',
    block: stored.block || '',
    avatar: stored.name ? stored.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : 'OF',
    id: stored.id || ''
  })

  const [issues, setIssues] = useState([])
  const [view, setView]     = useState('home')
  const [loading, setLoading] = useState(true)

  // Fetch officer profile from backend
  async function fetchProfile() {
    try {
      const { data } = await API.get('/api/block/profile')
      setOfficer({
        name: data.name,
        email: data.email,
        phone: data.phone,
        block: data.assignedBlock || stored.block,
        avatar: data.avatar || data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
        id: data._id || data.userId
      })
    } catch (err) {
      console.error('Failed to fetch officer profile:', err)
    }
  }

  // Fetch assigned block issues
  async function fetchIssues() {
    try {
      setLoading(true)
      const { data } = await API.get('/api/block/issues')
      setIssues(data)
    } catch (err) {
      console.error('Failed to fetch block issues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchIssues()
  }, [])

  // Update issue status via API
  async function updateStatus(id, status) {
    try {
      await API.put(`/api/issues/${id}/status`, { status })
      setIssues(prev => prev.map(i => i._id === id ? { ...i, status } : i))
    } catch (err) {
      console.error('Failed to update status:', err)
      alert(err.response?.data?.message || 'Failed to update issue status')
    }
  }

  // Toggle duplicate flag via API
  async function toggleDuplicate(id) {
    try {
      const { data } = await API.put(`/api/issues/${id}/duplicate`)
      setIssues(prev => prev.map(i => i._id === id ? { ...i, isDuplicate: data.isDuplicate } : i))
    } catch (err) {
      console.error('Failed to toggle duplicate:', err)
    }
  }

  const views = {
    home:      <OfficerHome      issues={issues} officer={officer} onStatusChange={updateStatus} onToggleDup={toggleDuplicate} loading={loading} />,
    myissues:  <OfficerMyIssues  issues={issues} officer={officer} onStatusChange={updateStatus} />,
    analytics: <OfficerAnalytics issues={issues} officer={officer} />,
    profile:   <OfficerProfile   officer={officer} />,
  }

  return (
    <div className="dashboard-wrapper officer-theme">
      <Sidebar
        role="officer"
        navItems={NAV}
        activeView={view}
        onNav={setView}
        userName={officer.name}
        userRole={officer.block}
      />
      <div className="main-content">
        <div className="top-bar officer-topbar">
          <div>
            <div className="top-bar-title">{NAV.find(n=>n.view===view)?.label}</div>
            <div className="top-bar-sub">Managing issues for <strong>{officer.block}</strong></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <NotificationBell />
            <div className="officer-topbar-badge">{officer.block}</div>
          </div>
        </div>
        <div className="page-content animate-fadeIn">
          {views[view]}
        </div>
      </div>
    </div>
  )
}
