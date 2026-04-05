import { useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'

const STATUSES   = ['all','Reported','In Progress','Resolved','Cancelled']
const CATEGORIES = ['all','Road & Infrastructure','Garbage & Sanitation','Water Supply','Electricity & Lighting','Public Safety','Drainage','Other']
const PRIORITIES = ['all','High','Medium','Low']

export default function MyReports({ issues, onEdit, onDelete, onNew }) {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')
  const [cat,    setCat]      = useState('all')
  const [pri,    setPri]      = useState('all')
  const [sort,   setSort]     = useState('newest')
  const [editModal, setEditModal] = useState(null)
  const [editStatus, setEditStatus] = useState('')

  let filtered = issues.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || i.title.toLowerCase().includes(q) || String(i.id).includes(q)
    const matchS = status === 'all' || i.status === status
    const matchC = cat    === 'all' || i.category === cat
    const matchP = pri    === 'all' || i.priority === pri
    return matchQ && matchS && matchC && matchP
  })

  filtered = [...filtered].sort((a,b) => {
    if (sort === 'newest') return new Date(b.reportedOn) - new Date(a.reportedOn)
    if (sort === 'oldest') return new Date(a.reportedOn) - new Date(b.reportedOn)
    const pOrder = { High:0, Medium:1, Low:2 }
    if (sort === 'priorityHigh') return pOrder[a.priority] - pOrder[b.priority]
    if (sort === 'priorityLow')  return pOrder[b.priority] - pOrder[a.priority]
    return 0
  })

  function openEdit(issue) {
    setEditModal(issue)
    setEditStatus(issue.status)
  }
  function saveEdit() {
    onEdit(editModal.id, { status: editStatus })
    setEditModal(null)
  }

  function clearFilters() {
    setSearch(''); setStatus('all'); setCat('all'); setPri('all'); setSort('newest')
  }

  return (
    <div className="my-reports">
      <div className="page-section-header" style={{ marginBottom:32, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>My Reports</h2>
          <p>Complete history of all urban issues reported by you.</p>
        </div>
        <button className="btn-primary" onClick={onNew} style={{ padding:'12px 24px' }}>+ Submit New Report</button>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ background:'white', borderRadius:16, padding:20, border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ position:'relative', flex:'1 1 240px' }}>
          <input type="search" placeholder="Search by title or ID…"
            value={search} onChange={e => setSearch(e.target.value)} 
            style={{ width:'100%', paddingLeft:40 }} />
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.4 }}>🔍</span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          <select value={status}   onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
          </select>
          <select value={cat}      onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
          <select value={pri}      onChange={e => setPri(e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priority' : p}</option>)}
          </select>
          <select value={sort}     onChange={e => setSort(e.target.value)} style={{ fontWeight:600, borderColor:'var(--primary-light)' }}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="priorityHigh">Priority: High</option>
            <option value="priorityLow">Priority: Low</option>
          </select>
          <button className="btn-ghost" onClick={clearFilters} style={{ padding:'8px 16px' }}>Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Issues ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>No issues match your filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="uv-table">
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Category</th>
                  <th>Priority</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(issue => (
                  <tr key={issue.id}>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>#{issue.id}</td>
                    <td style={{ fontWeight:600, maxWidth:220 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.title}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-light)', marginTop:2 }}>{issue.address}</div>
                    </td>
                    <td style={{ fontSize:'0.83rem' }}>{issue.category}</td>
                    <td><StatusBadge value={issue.priority} type="priority" /></td>
                    <td><StatusBadge value={issue.status}   type="status"   /></td>
                    <td style={{ fontSize:'0.82rem', color:'var(--text-light)', whiteSpace:'nowrap' }}>{issue.reportedOn}</td>
                    <td>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(issue)}>✏ Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => onDelete(issue.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={`Edit: ${editModal?.title}`}
        footer={<><button className="btn-ghost" onClick={() => setEditModal(null)}>Cancel</button><button className="btn-primary" onClick={saveEdit}>Save Changes</button></>}>
        {editModal && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <p style={{ fontSize:'0.82rem', color:'var(--text-light)', marginBottom:6 }}>
                <strong>Category:</strong> {editModal.category} &nbsp;|&nbsp;
                <strong>Priority:</strong> {editModal.priority} &nbsp;|&nbsp;
                <strong>Block:</strong> {editModal.block}
              </p>
              <p style={{ fontSize:'0.88rem', color:'var(--text-light)' }}>{editModal.description}</p>
            </div>
            <div className="form-group">
              <label>Update Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {['Reported','In Progress','Resolved','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
