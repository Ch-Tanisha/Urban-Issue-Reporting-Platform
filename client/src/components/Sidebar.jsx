import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

// Shield logo used as the UrbanVoice brand icon
const LOGO_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.55c0 4.55-3.08 8.8-8 9.93-4.92-1.13-8-5.38-8-9.93V7.78l8-3.6z"/>
    <path d="M11 15l-3-3 1.41-1.41L11 12.17l5.59-5.59L18 8l-7 7z"/>
  </svg>
)

/**
 * Sidebar — The main navigation panel shared by Citizen, Officer, and Admin dashboards.
 *
 * It receives nav items from the parent dashboard and highlights the active view.
 * On mobile screens, it slides in from the left as an overlay.
 *
 * Props:
 *   role          — 'citizen' | 'officer' | 'admin' (decides the subtitle)
 *   navItems      — array of { view, label, icon }
 *   activeView    — which nav item is currently selected
 *   onNav         — callback when a nav button is clicked
 *   userName      — name shown in the sidebar footer
 *   userRole      — subtitle under the name (e.g. "Block A")
 *   mobileOpen    — controls mobile slide-in visibility
 *   onCloseMobile — closes the mobile sidebar
 */
export default function Sidebar({ role, navItems, activeView, onNav, userName, userRole, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()

  async function handleLogout() {
    // Tell the server to clear the httpOnly cookie
    try {
      await API.post('/api/auth/logout')
    } catch {
      // Even if the server call fails, we still clear client-side data
    }
    // Clear the session data for this tab
    sessionStorage.removeItem('uv_token')
    sessionStorage.removeItem('uv_role')
    sessionStorage.removeItem('uv_user')
    navigate('/auth')
  }

  const roleLabels = {
    citizen: 'Citizen',
    officer: 'Block Officer',
    admin:   'Administrator',
  }

  const initials = (userName || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  return (
    <>
      {/* Dark overlay behind the sidebar on mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <button className="sidebar-close-mobile" onClick={onCloseMobile}>✕</button>

        {/* Brand */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">{LOGO_SVG}</div>
          <div>
            <div className="sidebar-logo-text">UrbanVoice</div>
            <div className="sidebar-logo-sub">{roleLabels[role]}</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.view}
              className={`nav-btn ${activeView === item.view ? 'active' : ''}`}
              onClick={() => { onNav(item.view); if (onCloseMobile) onCloseMobile() }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer: user info + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{userName || 'User'}</div>
              <div className="sidebar-user-role">{userRole || roleLabels[role]}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
