import StatusBadge from '../../components/StatusBadge'

export default function OfficerMyIssues({ issues, officer, onStatusChange }) {
  const active = issues.filter(i => i.status === 'In Progress' || i.status === 'Resolved')

  return (
    <div>
      <div className="page-section-header">
        <p className="eyebrow">My Issues</p>
        <h2>Issues I'm Working On</h2>
        <p>Issues you've started resolving (In Progress or Resolved) in {officer.block}.</p>
      </div>

      {active.length === 0 ? (
        <div className="empty-state panel" style={{ padding:60 }}>
          <div className="empty-icon">📋</div>
          <p>No active issues yet. Change the status of reported issues to see them here.</p>
        </div>
      ) : (
        <div className="officer-cards-grid">
          {active.map(issue => (
            <div key={issue._id} className="officer-issue-card">
              <div className="officer-issue-card-top">
                <StatusBadge value={issue.status} type="status" />
                <StatusBadge value={issue.priority} type="priority" />
              </div>
              <h4 className="officer-issue-title">{issue.title}</h4>
              <p className="officer-issue-cat">{issue.category}</p>
              <p className="officer-issue-addr">📍 {issue.address}</p>
              <p className="officer-issue-date">Reported: {issue.reportedOn || new Date(issue.createdAt).toLocaleDateString()}</p>
              <div style={{ marginTop:12, borderTop:'1px solid var(--off-border)', paddingTop:12 }}>
                <p style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--off-muted)', marginBottom:6, textTransform:'uppercase' }}>Citizen Info</p>
                <p style={{ fontSize:'0.85rem', fontWeight:600 }}>{issue.citizenName}</p>
                <a href={`mailto:${issue.citizenContact}`} style={{ fontSize:'0.8rem', color:'var(--off-accent)', display:'block', marginTop:2 }}>{issue.citizenContact}</a>
                <a href={`tel:${issue.citizenPhone}`}      style={{ fontSize:'0.8rem', color:'var(--off-accent)', display:'block', marginTop:2 }}>{issue.citizenPhone}</a>
              </div>
              <div style={{ marginTop:12 }}>
                <select
                  value={issue.status}
                  onChange={e => onStatusChange(issue._id, e.target.value)}
                  className="officer-status-select"
                  style={{ width:'100%', borderColor:'var(--off-border)' }}
                >
                  <option>Reported</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
