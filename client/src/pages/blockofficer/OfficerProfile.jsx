export default function OfficerProfile({ officer }) {
  return (
    <div>
      <div className="page-section-header">
        <p className="eyebrow">My Profile</p>
        <h2>Officer Details</h2>
        <p>Your profile and assignment information.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, maxWidth:700 }}>
        {/* Avatar */}
        <div className="panel" style={{ padding:32, textAlign:'center', alignSelf:'start' }}>
          <div className="profile-avatar-circle" style={{ margin:'0 auto 16px' }}>{officer.avatar}</div>
          <div style={{ fontWeight:800, fontSize:'1.1rem' }}>{officer.name}</div>
          <div style={{ color:'var(--text-light)', fontSize:'0.82rem', marginTop:4 }}>Block Officer</div>
          <div style={{ marginTop:10, fontSize:'0.78rem', padding:'4px 12px', background:'var(--status-resolved-bg)', color:'var(--status-resolved-text)', borderRadius:'999px', display:'inline-block', fontWeight:600 }}>
            Active
          </div>
        </div>

        {/* Info */}
        <div className="panel">
          <div className="panel-header"><h3>Assignment Info</h3></div>
          <div className="panel-body">
            {[
              ['Full Name',       officer.name],
              ['Role',            'Block Officer'],
              ['Assigned Block',  officer.block],
              ['Email',           officer.email],
              ['Phone',           officer.phone],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border-solid)' }}>
                <span style={{ minWidth:140, fontSize:'0.83rem', fontWeight:600, color:'var(--text-light)' }}>{k}</span>
                <span style={{ fontSize:'0.88rem', fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:16, background:'var(--gradient-soft)', borderRadius:'var(--radius-sm)', padding:14, fontSize:'0.85rem', color:'var(--text-light)' }}>
              As a Block Officer, you review citizen issues in your block, update their status, and ensure timely resolution. Contact the admin if your block assignment needs to change.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
