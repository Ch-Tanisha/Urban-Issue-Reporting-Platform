/**
 * StatCard — Reusable metric card used across all dashboards.
 * Shows a label, large value, colored icon badge, and optional subtitle.
 * @param {string} color - One of: blue, green, red, amber, purple, slate, sky
 */
export default function StatCard({ label, value, color, icon, sub }) {
  const colors = {
    blue:   { val: '#2563eb', bg: 'rgba(37,99,235,0.08)'  },
    green:  { val: '#059669', bg: 'rgba(5,150,105,0.08)'  },
    red:    { val: '#dc2626', bg: 'rgba(220,38,38,0.08)'  },
    amber:  { val: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
    purple: { val: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    slate:  { val: '#475569', bg: 'rgba(71,85,105,0.08)'  },
    sky:    { val: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${c.val}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span className="stat-label">{label}</span>
        {icon && (
          <span style={{
            width:36, height:36, borderRadius:10,
            background: c.bg, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'1.1rem',
          }}>{icon}</span>
        )}
      </div>
      <div className="stat-value" style={{ color: c.val }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
