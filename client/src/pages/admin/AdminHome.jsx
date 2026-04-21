import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'

export default function AdminHome({ issues }) {
  const total      = issues.length
  const reported   = issues.filter(i => i.status === 'Reported').length
  const inProgress = issues.filter(i => i.status === 'In Progress').length
  const resolved   = issues.filter(i => i.status === 'Resolved').length
  const high       = issues.filter(i => i.priority === 'High').length

  const recent = [...issues].sort((a,b) => new Date(b.reportedOn || b.createdAt) - new Date(a.reportedOn || a.createdAt)).slice(0,6)

  // Block summary
  const blockMap = {}
  issues.forEach(i => {
    if (!blockMap[i.block]) blockMap[i.block] = { total:0, resolved:0 }
    blockMap[i.block].total++
    if (i.status === 'Resolved') blockMap[i.block].resolved++
  })

  return (
    <div className="admin-home">
      <div className="page-section-header" style={{ marginBottom:32 }}>
        <p className="eyebrow">Overview</p>
        <h2>Control Panel</h2>
        <p>Real-time monitoring of urban issues across all active blocks.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Issues"   value={total}      color="slate"  icon="📋" sub="All blocks combined" />
        <StatCard label="Reported"       value={reported}   color="red"    icon="🔴" sub="Awaiting action" />
        <StatCard label="In Progress"    value={inProgress} color="blue"   icon="⏳" sub="Being resolved" />
        <StatCard label="Resolved"       value={resolved}   color="green"  icon="✅" sub="Successfully closed" />
        <StatCard label="High Priority"  value={high}       color="amber"  icon="🚨" sub="Need immediate action" />
        <StatCard label="Resolution Rate" value={total ? `${Math.round((resolved/total)*100)}%` : '0%'} color="purple" icon="📈" sub="Platform-wide" />
      </div>

      {/* Block summary + Recent */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:20 }}>
        {/* Block Overview */}
        <div className="panel">
          <div className="panel-header"><h3>Block Summary</h3></div>
          <div className="panel-body" style={{ padding:0 }}>
            {Object.entries(blockMap).map(([blk, data]) => (
              <div key={blk} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border-solid)' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{blk}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-light)' }}>{data.resolved}/{data.total} resolved</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ width:80, height:8, background:'var(--bg-muted)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${(data.resolved/data.total)*100}%`, height:'100%', background:'var(--secondary)', borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--secondary)', minWidth:32 }}>
                    {Math.round((data.resolved/data.total)*100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="panel">
          <div className="panel-header"><h3>Recent Issues</h3><p>Latest across all blocks</p></div>
          <div style={{ padding:'0 20px 20px' }}>
            {recent.map(issue => (
              <div key={issue._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border-solid)', gap:12 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.title}</div>
                  <div style={{ fontSize:'0.76rem', color:'var(--text-light)', marginTop:2 }}>{issue.block} · {issue.category} · {issue.reportedOn}</div>
                </div>
                <StatusBadge value={issue.status} type="status" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
