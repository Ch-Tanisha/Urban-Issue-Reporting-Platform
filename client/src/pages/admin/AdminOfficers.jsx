import { officers } from '../../data/mockData'

export default function AdminOfficers() {
  return (
    <div>
      <div className="page-section-header">
        <p className="eyebrow">Block Officers</p>
        <h2>Manage Block Officers</h2>
        <p>View contact information for all assigned block officers.</p>
      </div>

      <div className="admin-officers-grid">
        {officers.map(o => (
          <div key={o.id} className="admin-officer-card">
            <div className="admin-officer-header">
              <div className="admin-officer-avatar">{o.avatar}</div>
              <span className="admin-block-tag">{o.block}</span>
            </div>
            <h3 className="admin-officer-name">{o.name}</h3>
            <p className="admin-officer-role">Block Officer</p>
            <div className="admin-officer-contacts">
              <a href={`mailto:${o.email}`} className="admin-contact-item">
                <span>✉</span> {o.email}
              </a>
              <a href={`tel:${o.phone}`} className="admin-contact-item">
                <span>📞</span> {o.phone}
              </a>
            </div>
            <div style={{ marginTop:16, display:'flex', gap:8 }}>
              <a href={`mailto:${o.email}`} className="btn-ghost btn-sm" style={{ flex:1, textAlign:'center', textDecoration:'none' }}>✉ Email</a>
              <a href={`tel:${o.phone}`}    className="btn-ghost btn-sm" style={{ flex:1, textAlign:'center', textDecoration:'none' }}>📞 Call</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
