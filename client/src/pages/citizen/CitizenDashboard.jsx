import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import CitizenHome    from './CitizenHome'
import ReportIssue   from './ReportIssue'
import MyReports      from './MyReports'
import CitizenProfile from './CitizenProfile'
import { initialIssues, currentCitizen } from '../../data/mockData'
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
  const [issues, setIssues] = useState(
    initialIssues.filter(i => i.citizenName === 'Rahul Sharma')
      .concat([
        { ...initialIssues[1], id: 99, citizenName:'Raj Sharma' },
        { ...initialIssues[3], id: 98, citizenName:'Raj Sharma' },
      ])
  )
  const stored = JSON.parse(localStorage.getItem('uv_user') || '{}')
  const citizen = { ...currentCitizen, name: stored.name || currentCitizen.name, email: stored.email || currentCitizen.email }

  function addIssue(issue) {
    setIssues(prev => [{ ...issue, id: Date.now(), status:'Reported', reportedOn: new Date().toISOString().split('T')[0], citizenName: citizen.name, citizenContact: citizen.email, citizenPhone: citizen.phone, isDuplicate: false }, ...prev])
    setView('reports')
  }

  function updateIssue(id, data) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
  }

  function deleteIssue(id) {
    setIssues(prev => prev.filter(i => i.id !== id))
  }

  const views = {
    home:    <CitizenHome    issues={issues} onNav={setView} citizen={citizen} />,
    report:  <ReportIssue   onSubmit={addIssue} onCancel={() => setView('home')} citizen={citizen} />,
    reports: <MyReports     issues={issues} onEdit={(id,d) => updateIssue(id,d)} onDelete={deleteIssue} onNew={() => setView('report')} />,
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
      />
      <div className="main-content">
        <div className="top-bar">
          <div>
            <div className="top-bar-title">{NAV.find(n=>n.view===view)?.label}</div>
            <div className="top-bar-sub">UrbanVoice Citizen Portal</div>
          </div>
          <button className="btn-primary btn-sm" onClick={() => setView('report')}>+ New Report</button>
        </div>
        <div className="page-content animate-fadeIn">
          {views[view]}
        </div>
      </div>
    </div>
  )
}
