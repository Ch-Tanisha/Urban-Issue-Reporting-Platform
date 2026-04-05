import StatCard from '../../components/StatCard'

export default function OfficerAnalytics({ issues, officer }) {
  const base     = issues.filter(i => !i.isDuplicate)
  const total    = base.length
  const reported = base.filter(i => i.status === 'Reported').length
  const inProg   = base.filter(i => i.status === 'In Progress').length
  const resolved = base.filter(i => i.status === 'Resolved').length
  const high     = base.filter(i => i.priority === 'High').length
  const medium   = base.filter(i => i.priority === 'Medium').length
  const low      = base.filter(i => i.priority === 'Low').length
  const rate     = total > 0 ? Math.round((resolved / total) * 100) : 0

  const catCounts = {}
  base.forEach(i => { catCounts[i.category] = (catCounts[i.category]||0)+1 })

  return (
    <div>
      <div className="page-section-header">
        <p className="eyebrow">Block Analytics</p>
        <h2>Statistics for {officer.block}</h2>
        <p>Quick metrics based on current non-duplicate issues in your block.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Active"   value={total}    color="slate"  icon="📊" sub="Non-duplicate issues" />
        <StatCard label="Reported"       value={reported} color="red"    icon="🔴" sub="Waiting pickup" />
        <StatCard label="In Progress"    value={inProg}   color="blue"   icon="⏳" sub="Being worked on" />
        <StatCard label="Resolved"       value={resolved} color="green"  icon="✅" sub="Fixed" />
        <StatCard label="High Priority"  value={high}     color="amber"  icon="🚨" sub="Need fast response" />
        <StatCard label="Resolution Rate" value={`${rate}%`} color="purple" icon="📈" sub="Share resolved" />
      </div>

      {/* Priority Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="panel">
          <div className="panel-header"><h3>Priority Breakdown</h3></div>
          <div className="panel-body">
            {[['High',high,'var(--danger)'],['Medium',medium,'var(--warning)'],['Low',low,'var(--secondary)']].map(([l,v,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <span style={{ minWidth:60, fontSize:'0.82rem', fontWeight:600, color:c }}>{l}</span>
                <div style={{ flex:1, height:10, background:'var(--bg-muted)', borderRadius:5, overflow:'hidden' }}>
                  <div style={{ width: total ? `${(v/total)*100}%` : '0%', height:'100%', background:c, borderRadius:5, transition:'width 0.6s ease' }} />
                </div>
                <span style={{ fontWeight:700, color:c, minWidth:24 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="panel">
          <div className="panel-header"><h3>Category Breakdown</h3></div>
          <div className="panel-body">
            {Object.entries(catCounts).map(([cat, count]) => (
              <div key={cat} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-light)', minWidth:130 }}>{cat}</span>
                <div style={{ flex:1, height:8, background:'var(--bg-muted)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${(count/total)*100}%`, height:'100%', background:'var(--primary)', borderRadius:4, transition:'width 0.6s ease' }} />
                </div>
                <span style={{ fontWeight:700, minWidth:20, textAlign:'right', fontSize:'0.85rem' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {total === 0 && (
        <div className="empty-state panel"><div className="empty-icon">📊</div><p>No data to analyze yet.</p></div>
      )}
    </div>
  )
}
