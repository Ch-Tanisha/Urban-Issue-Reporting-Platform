export default function StatusBadge({ value, type = 'status' }) {
  if (type === 'status') {
    const map = {
      'Reported':    'badge badge-reported',
      'In Progress': 'badge badge-progress',
      'Resolved':    'badge badge-resolved',
      'Cancelled':   'badge badge-cancelled',
    }
    const dots = {
      'Reported':    '🔴',
      'In Progress': '🔵',
      'Resolved':    '🟢',
      'Cancelled':   '⚪',
    }
    return (
      <span className={map[value] || 'badge badge-cancelled'}>
        {dots[value] && <span style={{ fontSize:'0.6rem' }}>{dots[value]}</span>}
        {value || '—'}
      </span>
    )
  }

  if (type === 'priority') {
    const map = {
      'High':   'badge badge-high',
      'Medium': 'badge badge-medium',
      'Low':    'badge badge-low',
    }
    return <span className={map[value] || 'badge'}>{value || '—'}</span>
  }

  return <span className="badge">{value}</span>
}
