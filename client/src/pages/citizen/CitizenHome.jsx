import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'

export default function CitizenHome({ issues, onNav, citizen, loading }) {
  const total      = issues.length
  const pending    = issues.filter(i => i.status === 'Reported').length
  const inProgress = issues.filter(i => i.status === 'In Progress').length
  const resolved   = issues.filter(i => i.status === 'Resolved').length

  const recentIssues = [...issues].sort((a,b) => new Date(b.reportedOn || b.createdAt) - new Date(a.reportedOn || a.createdAt)).slice(0,5)

  return (
    <div className="citizen-home">
      {/* Welcome Banner */}
      <div className="citizen-welcome" style={{ borderRadius:16, padding:'28px 32px', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, lineHeight:1.2, marginBottom:8, color:'var(--text)' }}>Welcome back, {citizen.name.split(' ')[0]} 👋</h1>
          <p style={{ color:'var(--text-light)', maxWidth:420, fontSize:'0.9rem' }}>Track your neighborhood reports and stay connected with your local block officer.</p>
        </div>
        <div className="citizen-welcome-actions" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn-primary" onClick={() => onNav('report')}>+ Report New Issue</button>
          <button className="btn-ghost" onClick={() => onNav('reports')}>View My Reports</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <StatCard label="Pending Review"  value={pending}    color="red"   icon="🔴" sub="Awaiting officer action" />
        <StatCard label="In Progress"     value={inProgress} color="blue"  icon="⏳" sub="Being worked on" />
        <StatCard label="Resolved"        value={resolved}   color="green" icon="✅" sub="Fixed by officer" />
        <StatCard label="Total Reported"  value={total}      color="slate" icon="📋" sub="All your submissions" />
      </div>

      {/* Info Grid */}
      <div className="citizen-info-grid">
        {/* Quick Actions */}
        <div className="panel">
          <div className="panel-header"><div><h3>Quick Actions</h3><p>Jump into the most common tasks.</p></div></div>
          <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Report a new issue', icon:'📝', view:'report' },
              { label:'Track my reports',   icon:'📊', view:'reports' },
              { label:'Update my profile',  icon:'👤', view:'profile' },
            ].map(a => (
              <button key={a.view} className="citizen-action-chip" onClick={() => onNav(a.view)}>
                <span style={{ fontSize:'1.1rem' }}>{a.icon}</span>
                <span>{a.label}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="panel">
          <div className="panel-header"><div><h3>Status Breakdown</h3><p>Live metrics from your submissions.</p></div></div>
          <div className="panel-body">
            {[
              { label:'Reported',    val: pending,    color:'var(--status-reported-text)', bg:'var(--status-reported-bg)' },
              { label:'In Progress', val: inProgress, color:'var(--status-progress-text)', bg:'var(--status-progress-bg)' },
              { label:'Resolved',    val: resolved,   color:'var(--status-resolved-text)', bg:'var(--status-resolved-bg)' },
            ].map(s => (
              <div key={s.label} className="breakdown-row">
                <span style={{ color: s.color, fontSize:'0.85rem', fontWeight:600 }}>{s.label}</span>
                <span className="breakdown-bar-wrap">
                  <span className="breakdown-bar" style={{ width: total ? `${(s.val/total)*100}%` : '0%', background: s.color }} />
                </span>
                <span style={{ fontWeight:700, color: s.color, minWidth:20, textAlign:'right' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Your Block Info */}
        <div className="panel officer-contact-card">
          <div className="panel-header"><div><h3>Your Block</h3><p>Assigned area information</p></div></div>
          <div className="panel-body">
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div className="officer-avatar-lg" style={{ background:'var(--gradient)', color:'white' }}>
                {citizen.block?.replace('Block ', '') || '?'}
              </div>
              <div>
                <div className="officer-name">{citizen.block}</div>
                <div className="officer-block" style={{ fontSize:'0.82rem', color:'var(--text-light)' }}>{citizen.address || 'Address not set'}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-light)', marginTop:4 }}>{citizen.city || ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="panel" style={{ marginTop: 24 }}>
        <div className="panel-header">
          <div><h3>Recent Activity</h3><p>Your last {recentIssues.length} submissions.</p></div>
          <button className="btn-ghost btn-sm" onClick={() => onNav('reports')}>View All</button>
        </div>
        {loading ? (
          <div className="empty-state"><p>⏳ Loading your reports…</p></div>
        ) : recentIssues.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><p>No reports yet. Create your first issue!</p></div>
        ) : (
          <div style={{ padding:'0 20px 20px' }}>
            {recentIssues.map(issue => (
              <div key={issue._id} className="recent-report-row">
                <div className="recent-report-info">
                  <div className="recent-report-title">{issue.title}</div>
                  <div className="recent-report-meta">{issue.category} · {issue.reportedOn || new Date(issue.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusBadge value={issue.status} type="status" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
