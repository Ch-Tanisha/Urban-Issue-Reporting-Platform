import { useState } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const CHART_OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }

export default function OfficerHome({ issues, officer, onStatusChange, onToggleDup }) {
  const [statusF,   setStatusF]   = useState('all')
  const [priorityF, setPriorityF] = useState('all')
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState(null)

  const base = issues.filter(i => !i.isDuplicate)

  const total      = base.length
  const reported   = base.filter(i => i.status === 'Reported').length
  const inProgress = base.filter(i => i.status === 'In Progress').length
  const resolved   = base.filter(i => i.status === 'Resolved').length

  let filtered = base.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || `${i.title} ${i.category} ${i.address}`.toLowerCase().includes(q)
    const matchS = statusF   === 'all' || i.status   === statusF
    const matchP = priorityF === 'all' || i.priority === priorityF
    return matchQ && matchS && matchP
  })

  // Category chart data
  const catCounts = {}
  base.forEach(i => { catCounts[i.category] = (catCounts[i.category]||0)+1 })

  const donutData = {
    labels: ['Reported','In Progress','Resolved'],
    datasets: [{ data:[reported, inProgress, resolved], backgroundColor:['#38bdf8','#fbbf24','#10b981'], borderWidth:0 }]
  }
  const barData = {
    labels: Object.keys(catCounts),
    datasets: [{ data:Object.values(catCounts), backgroundColor:'#38bdf8', borderRadius:6 }]
  }

  return (
    <div className="officer-home">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Issues"  value={total}      color="sky"   icon="📍" sub="Active block issues" />
        <StatCard label="Reported"      value={reported}   color="amber" icon="🛈"  sub="Awaiting action" />
        <StatCard label="In Progress"   value={inProgress} color="blue"  icon="⏳" sub="Currently active" />
        <StatCard label="Resolved"      value={resolved}   color="green" icon="✔"  sub="Total fixed" />
      </div>

      {/* Charts Row */}
      <div className="officer-charts-row">
        {/* Filters */}
        <div className="panel">
          <div className="panel-header"><h3>Filters</h3></div>
          <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="form-group">
              <label>Status</label>
              <select value={statusF} onChange={e => setStatusF(e.target.value)}>
                <option value="all">Every Status</option>
                <option>Reported</option><option>In Progress</option><option>Resolved</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priorityF} onChange={e => setPriorityF(e.target.value)}>
                <option value="all">Every Priority</option>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quick Search</label>
              <input type="text" placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="panel">
          <div className="panel-header"><h3>Status Distribution</h3></div>
          <div className="panel-body" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24 }}>
            <div style={{ height:170, width:170, flexShrink:0 }}>
              <Doughnut data={donutData} options={{ ...CHART_OPTS, cutout:'72%' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:'0.8rem' }}>
              {[['Reported','#38bdf8',reported],['In Progress','#fbbf24',inProgress],['Resolved','#10b981',resolved]].map(([l,c,v])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0 }} />
                  <span style={{ color:'var(--off-muted)' }}>{l}</span>
                  <strong style={{ marginLeft:'auto', color:'var(--off-text)' }}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="panel">
          <div className="panel-header"><h3>Categories</h3></div>
          <div className="panel-body" style={{ height:200 }}>
            <Bar 
              data={barData} 
              options={{ 
                ...CHART_OPTS, 
                scales:{ 
                  x:{ ticks:{ color:'#94a3b8', font:{ size:10 } }, grid:{ display:false } }, 
                  y:{ beginAtZero:true, ticks:{ color:'#94a3b8', stepSize:1 }, grid:{ color:'rgba(255,255,255,0.05)' } } 
                } 
              }} 
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Issues List</h3>
          <span style={{ fontSize:'0.8rem', color:'var(--off-muted)' }}>{filtered.length} matching found</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔍</div><p>No results for these filters.</p></div>
        ) : (
          <div className="table-wrap" style={{ border:'none' }}>
            <table className="uv-table">
              <thead>
                <tr><th>ID</th><th>Issue Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Reported</th><th style={{textAlign:'right'}}>Manage</th></tr>
              </thead>
              <tbody>
                {filtered.map(issue => (
                  <tr key={issue.id}>
                    <td style={{ color:'var(--off-muted)', fontSize:'0.8rem' }}>#{issue.id}</td>
                    <td style={{ fontWeight:600, maxWidth:220 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.title}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--off-muted)', fontWeight:400 }}>{issue.address}</div>
                    </td>
                    <td style={{ fontSize:'0.82rem' }}>{issue.category}</td>
                    <td><StatusBadge value={issue.priority} type="priority" /></td>
                    <td><StatusBadge value={issue.status}   type="status"   /></td>
                    <td style={{ fontSize:'0.8rem', color:'var(--off-muted)', whiteSpace:'nowrap' }}>{issue.reportedOn}</td>
                    <td style={{ textAlign:'right' }}>
                      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <select
                          value={issue.status}
                          onChange={e => onStatusChange(issue.id, e.target.value)}
                          className="officer-status-select"
                        >
                          <option>Reported</option><option>In Progress</option><option>Resolved</option>
                        </select>
                        <button className="btn-ghost btn-sm" style={{borderColor:'var(--off-border)', color:'var(--off-text)'}} onClick={() => setModal(issue)}>Details</button>
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
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.title || ''}>
        {modal && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:'0.9rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                ['Category',    modal.category],
                ['Priority',    modal.priority],
                ['Status',      modal.status],
                ['Reported On', modal.reportedOn],
              ].map(([k,v]) => (
                <div key={k}>
                  <p style={{ color:'var(--off-muted)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginBottom:2 }}>{k}</p>
                  <p style={{ fontWeight:500 }}>{v}</p>
                </div>
              ))}
            </div>
            
            <div>
              <p style={{ color:'var(--off-muted)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Exact Location</p>
              <p style={{ fontWeight:500 }}>{modal.address}, {modal.block}</p>
            </div>

            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius: 12, padding:16, border:'1px solid var(--off-border)' }}>
              <p style={{ fontWeight:700, color:'var(--off-accent)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Citizen Information</p>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <p style={{ fontSize:'1rem', fontWeight:600 }}>{modal.citizenName}</p>
                <p style={{ color:'var(--off-muted)' }}>📧 {modal.citizenContact}</p>
                <p style={{ color:'var(--off-muted)' }}>📱 {modal.citizenPhone}</p>
              </div>
            </div>

            <div>
              <p style={{ color:'var(--off-muted)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Issue Description</p>
              <p style={{ color:'var(--off-text)', lineHeight:1.6, background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8 }}>{modal.description}</p>
            </div>

            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <button 
                className="btn-primary btn-sm" 
                style={{ flex:1, justifyContent:'center' }}
                onClick={() => onToggleDup(modal.id)}
              >
                {modal.isDuplicate ? '↩ Mark as Valid' : '⊟ Mark as Duplicate'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
