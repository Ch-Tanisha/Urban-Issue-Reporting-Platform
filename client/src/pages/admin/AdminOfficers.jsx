import { useState, useEffect } from 'react'
import API from '../../api/axios'

function mailtoHref(value) {
  const raw = String(value || '').trim()
  const email = raw.match(/<([^>]+)>/)?.[1] || raw
  return `mailto:${email.trim()}`
}

export default function AdminOfficers() {
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', assignedBlock:'' })
  const [formError, setFormError] = useState('')

  async function fetchOfficers() {
    try {
      setLoading(true)
      const { data } = await API.get('/api/admin/officers')
      setOfficers(data)
      setFormError('')
    } catch (err) {
      console.error('Failed to fetch officers:', err)
      if (err.response?.status === 403) {
        setFormError('Your current session does not have admin privileges. Please log out and log in again as Administrator.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOfficers()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.email || !form.password || !form.assignedBlock) {
      setFormError('All fields are required')
      return
    }
    try {
      await API.post('/api/admin/officers', form)
      setForm({ name:'', email:'', password:'', phone:'', assignedBlock:'' })
      setShowCreate(false)
      await fetchOfficers()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create officer')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this officer?')) return
    try {
      await API.delete(`/api/admin/officers/${id}`)
      setOfficers(prev => prev.filter(o => o._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete officer')
    }
  }

  return (
    <div>
      <div className="page-section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2>Manage Block Officers</h2>
          <p>View, create, and manage block officer accounts.</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ Add Officer'}
        </button>
      </div>

      {/* Create Officer Form */}
      {showCreate && (
        <div className="panel" style={{ marginBottom:24 }}>
          <div className="panel-header"><h3>Create New Block Officer</h3></div>
          <div className="panel-body">
            {formError && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 16px', borderRadius:8, fontSize:'0.85rem', marginBottom:16, border:'1px solid #fecaca' }}>{formError}</div>}
            <form onSubmit={handleCreate}>
              <div className="report-form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Officer name" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="officer@email.com" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Strong password" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="form-group">
                  <label>Assigned Block *</label>
                  <select value={form.assignedBlock} onChange={e => setForm({...form, assignedBlock:e.target.value})}>
                    <option value="">Select block</option>
                    <option>Block A</option><option>Block B</option><option>Block C</option><option>Block D</option><option>Block E</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop:16 }}>✅ Create Officer</button>
            </form>
          </div>
        </div>
      )}

      {/* Officers Grid */}
      {loading ? (
        <div className="empty-state panel" style={{ padding:60 }}><p>⏳ Loading officers…</p></div>
      ) : officers.length === 0 ? (
        <div className="empty-state panel" style={{ padding:60 }}>
          <div className="empty-icon">👮</div>
          <p>No block officers found. Create one above.</p>
        </div>
      ) : (
        <div className="admin-officers-grid">
          {officers.map(o => (
            <div key={o._id} className="admin-officer-card">
              <div className="admin-officer-header">
                <div className="admin-officer-avatar">{o.avatar || o.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                <span className="admin-block-tag">{o.assignedBlock}</span>
              </div>
              <h3 className="admin-officer-name">{o.name}</h3>
              <p className="admin-officer-role">Block Officer</p>
              <div className="admin-officer-contacts">
                <a href={mailtoHref(o.email)} className="admin-contact-item">
                  <span>✉</span> {o.email}
                </a>
                <a href={`tel:${o.phone}`} className="admin-contact-item">
                  <span>📞</span> {o.phone}
                </a>
              </div>
              <div style={{ marginTop:16, display:'flex', gap:8 }}>
                <a href={mailtoHref(o.email)} className="btn-ghost btn-sm" style={{ flex:1, textAlign:'center', textDecoration:'none' }}>✉ Email</a>
                <button className="btn-danger btn-sm" style={{ flex:1 }} onClick={() => handleDelete(o._id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
