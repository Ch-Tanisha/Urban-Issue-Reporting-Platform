/**
 * StatusBadge — Displays a colored pill badge for issue status or priority.
 * 
 * Usage:
 *   <StatusBadge value="Reported" type="status" />
 *   <StatusBadge value="High" type="priority" />
 * 
 * Status values:  Reported | In Progress | Resolved | Cancelled
 * Priority values: High | Medium | Low
 * 
 * CSS classes (defined in global.css):
 *   .badge-reported, .badge-progress, .badge-resolved, .badge-cancelled
 *   .badge-high, .badge-medium, .badge-low
 */
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
