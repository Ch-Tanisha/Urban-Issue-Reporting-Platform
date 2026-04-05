import { useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'

const STATUSES   = ['all','Reported','In Progress','Resolved']
const BLOCKS     = ['all','Block A','Block B','Block C','Block D','Block E']
const CATEGORIES = ['all','Road & Infrastructure','Garbage & Sanitation','Water Supply','Electricity & Lighting','Public Safety','Drainage','Other']
const PRIORITIES = ['all','High','Medium','Low']

export default function AdminIssues({ issues, onResolve, onDelete, onStatus }) {
  const [search,   setSearch]  = useState('')
  const [status,   setStatus]  = useState('all')
  const [block,    setBlock]   = useState('all')
  const [cat,      setCat]     = useState('all')
  const [pri,      setPri]     = useState('all')
  const [detail,   setDetail]  = useState(null)
  const [confirm,  setConfirm] = useState(null)  // { id, action }

  let filtered = issues.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || `${i.title} ${i.citizenName} ${i.address}`.toLowerCase().includes(q)
    const matchS = status === 'all' || i.status   === status
    const matchB = block  === 'all' || i.block    === block
    const matchC = cat    === 'all' || i.category === cat
    const matchP = pri    === 'all' || i.priority === pri
    return matchQ && matchS && matchB && matchC && matchP
  }).sort((a,b) => new Date(b.reportedOn) - new Date(a.reportedOn))

  function clearFilters() {
    setSearch(''); setStatus('all'); setBlock('all'); setCat('all'); setPri('all')
  }

  function handleConfirm() {
    if (!confirm) return
    if (confirm.action === 'resolve') onResolve(confirm.id)
    if (confirm.action === 'delete')  onDelete(confirm.id)
    setConfirm(null)
  }

  return (
    <div>
      <div className="page-section-header">
        <p className="eyebrow">All Issues</p>
        <h2>Reported Issues — All Blocks</h2>
        <p>Filter, update, resolve, or delete issues across the entire system.</p>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom:20 }}>
        <input type="search" placeholder="🔍 Search title, citizen, address…"
          value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:'1 1 200px' }} />
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          {STATUSES.map(s=><option key={s} value={s}>{s==='all'?'All Statuses':s}</option>)}
        </select>
        <select value={block} onChange={e=>setBlock(e.target.value)}>
          {BLOCKS.map(b=><option key={b} value={b}>{b==='all'?'All Blocks':b}</option>)}
        </select>
        <select value={cat} onChange={e=>setCat(e.target.value)}>
          {CATEGORIES.map(c=><option key={c} value={c}>{c==='all'?'All Categories':c}</option>)}
        </select>
        <select value={pri} onChange={e=>setPri(e.target.value)}>
          {PRIORITIES.map(p=><option key={p} value={p}>{p==='all'?'All Priorities':p}</option>)}
        </select>
        <button className="btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Issues ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔍</div><p>No issues match these filters.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="uv-table">
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Block</th><th>Category</th>
                  <th>Priority</th><th>Status</th><th>Date</th><th>Citizen</th><th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(issue => (
                  <tr key={issue.id}>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>#{issue.id}</td>
                    <td style={{ fontWeight:600, maxWidth:180 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.title}</div>
                    </td>
                    <td><span style={{ background:'rgba(37,99,235,0.1)', color:'var(--primary)', padding:'2px 8px', borderRadius:999, fontSize:'0.75rem', fontWeight:600 }}>{issue.block}</span></td>
                    <td style={{ fontSize:'0.8rem' }}>{issue.category}</td>
                    <td><StatusBadge value={issue.priority} type="priority" /></td>
                    <td>
                      <select value={issue.status} onChange={e=>onStatus(issue.id,e.target.value)} className="officer-status-select">
                        <option>Reported</option><option>In Progress</option><option>Resolved</option>
                      </select>
                    </td>
                    <td style={{ fontSize:'0.78rem', color:'var(--text-light)', whiteSpace:'nowrap' }}>{issue.reportedOn}</td>
                    <td style={{ fontSize:'0.78rem' }}>{issue.citizenName}</td>
                    <td style={{ textAlign:'right' }}>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <button className="btn-ghost btn-sm" onClick={()=>setDetail(issue)}>👁 View</button>
                        <button className="btn-ghost btn-sm" style={{ color:'var(--secondary)' }} onClick={()=>setConfirm({id:issue.id,action:'resolve'})}>✅ Resolve</button>
                        <button className="btn-danger btn-sm"  onClick={()=>setConfirm({id:issue.id,action:'delete'})}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={()=>setDetail(null)} title={detail?.title || ''} maxWidth={580}>
        {detail && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:'0.9rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                ['Category',    detail.category],
                ['Priority',    detail.priority],
                ['Status',      detail.status],
                ['Reported On', detail.reportedOn],
              ].map(([k,v]) => (
                <div key={k}>
                  <p style={{ color:'var(--text-light)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginBottom:2 }}>{k}</p>
                  <p style={{ fontWeight:600 }}>{v}</p>
                </div>
              ))}
            </div>
            
            <div>
              <p style={{ color:'var(--text-light)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Exact Location</p>
              <p style={{ fontWeight:600 }}>{detail.address}, {detail.block}</p>
            </div>

            <div style={{ background:'var(--bg-light)', borderRadius: 12, padding:16, border:'1px solid var(--border-solid)' }}>
              <p style={{ fontWeight:700, color:'var(--primary)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Reported By (Citizen)</p>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <p style={{ fontSize:'1rem', fontWeight:700 }}>{detail.citizenName}</p>
                <div style={{ display:'flex', gap:12 }}>
                  <p style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>📧 {detail.citizenContact}</p>
                  <p style={{ color:'var(--text-light)', fontSize:'0.85rem' }}>📱 {detail.citizenPhone}</p>
                </div>
              </div>
            </div>

            <div>
              <p style={{ color:'var(--text-light)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Issue Description</p>
              <p style={{ color:'var(--text)', lineHeight:1.6, background:'#f8fafc', padding:14, borderRadius:10, border:'1px solid var(--border-solid)' }}>{detail.description}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title={confirm?.action === 'delete' ? '⚠️ Delete Issue?' : '✅ Resolve Issue?'}
        footer={<><button className="btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button><button className={confirm?.action==='delete'?'btn-danger':'btn-primary'} onClick={handleConfirm}>Confirm</button></>}>
        <p style={{ color:'var(--text-light)' }}>
          {confirm?.action === 'delete'
            ? 'This will permanently remove the issue. This cannot be undone.'
            : 'This will mark the issue as Resolved.'}
        </p>
      </Modal>
    </div>
  )
}
