import { useState, useEffect, useRef } from 'react'
import API from '../api/axios'

/**
 * NotificationBell — Dropdown notification center shown in every dashboard top bar.
 * 
 * Features:
 *   - Polls GET /api/notifications every 30 seconds for new notifications
 *   - Shows unread count badge on the bell icon
 *   - Mark individual or all notifications as read
 *   - Delete individual notifications
 *   - Closes when clicking outside (useRef + mousedown listener)
 * 
 * Notification types: status_update, new_issue, duplicate_flag, system
 * Each type maps to an emoji icon via the iconMap object.
 * 
 * Styling: Uses inline styles with CSS variable fallbacks for dark theme support.
 */
export default function NotificationBell() {
  const [open, setOpen]             = useState(false)
  const [notifications, setNotifs]  = useState([])
  const [unread, setUnread]         = useState(0)
  const [loading, setLoading]       = useState(false)
  const ref = useRef()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch notifications on mount and every 30s
  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNotifs() {
    try {
      setLoading(true)
      const { data } = await API.get('/api/notifications')
      setNotifs(data.notifications || [])
      setUnread(data.unreadCount || 0)
    } catch (err) {
      // Silent fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await API.put('/api/notifications/read-all')
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnread(0)
    } catch (err) {}
  }

  async function markOne(id) {
    try {
      await API.put(`/api/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch (err) {}
  }

  async function deleteOne(id) {
    try {
      await API.delete(`/api/notifications/${id}`)
      const removed = notifications.find(n => n._id === id)
      setNotifs(prev => prev.filter(n => n._id !== id))
      if (removed && !removed.isRead) setUnread(prev => Math.max(0, prev - 1))
    } catch (err) {}
  }

  const iconMap = {
    status_update:  '🔄',
    new_issue:      '📝',
    duplicate_flag: '⚠️',
    system:         '🔔',
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifs() }}
        style={{
          position: 'relative',
          width: 40, height: 40,
          borderRadius: '50%',
          // Fallback colors ensure visibility on dark officer theme
          border: '1.5px solid var(--border-solid, #e2e8f0)',
          background: 'var(--bg, #ffffff)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          transition: 'all 0.2s',
          boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#dc2626', color: '#fff',
            borderRadius: '999px', fontSize: '0.65rem',
            fontWeight: 700, minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid white',
            animation: 'countUp 0.3s ease',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0, zIndex: 9999,
          width: 360, maxHeight: 480,
          // Explicit fallback ensures dropdown is visible on dark themes
          background: 'var(--bg, #ffffff)', borderRadius: 16,
          border: '1px solid var(--border-solid, #e2e8f0)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease',
          color: 'var(--text, #0f172a)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderBottom: '1px solid var(--border-solid)',
            background: 'var(--bg-light)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              🔔 Notifications {unread > 0 && <span style={{ color:'#dc2626' }}>({unread} new)</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', fontSize: '0.75rem',
                color: 'var(--primary)', fontWeight: 600, cursor: 'pointer',
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: 380 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔕</div>
                <div style={{ fontSize: '0.88rem' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id}
                  onClick={() => !n.isRead && markOne(n._id)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid var(--border-solid)',
                    background: n.isRead ? 'var(--bg)' : 'rgba(37,99,235,0.04)',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>
                    {iconMap[n.type] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.83rem', color: 'var(--text)',
                      lineHeight: 1.45, margin: 0,
                      fontWeight: n.isRead ? 400 : 600,
                    }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--primary)', flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteOne(n._id) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0 4px',
                      flexShrink: 0, alignSelf: 'flex-start',
                    }}
                    title="Delete"
                  >✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
