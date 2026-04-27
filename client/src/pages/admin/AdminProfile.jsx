import { useState } from 'react'
import API from '../../api/axios'

/**
 * AdminProfile — Displays the admin's profile information.
 * Allows editing name, phone, and changing password.
 * Email is read-only (it's the login credential).
 * Reuses the same /api/auth/profile and /api/auth/password endpoints
 * that CitizenProfile uses.
 */
export default function AdminProfile({ adminName, adminEmail, adminPhone }) {
  // ── Profile edit state ───────────────────────────────────────────────
  const [form, setForm]       = useState({ name: adminName, phone: adminPhone })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // ── Password change state ────────────────────────────────────────────
  const [pwdForm, setPwdForm]     = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg]       = useState('')
  const [pwdErr, setPwdErr]       = useState('')

  // ── Admin creation state (admin-only) ───────────────────────────────
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', phone: '', password: '' })
  const [createSaving, setCreateSaving] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [createErr, setCreateErr] = useState('')

  // Build initials for avatar (e.g. "John Doe" → "JD")
  const initials = (form.name || 'A')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // ── Profile save handler ─────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    try {
      const { data } = await API.put('/api/auth/profile', {
        name:  form.name,
        phone: form.phone,
      })
      // Sync sessionStorage so the sidebar name updates too
      const stored = JSON.parse(sessionStorage.getItem('uv_user') || '{}')
      sessionStorage.setItem('uv_user', JSON.stringify({ ...stored, ...data }))
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  // ── Password change handler ──────────────────────────────────────────
  async function handlePassword(e) {
    e.preventDefault()
    setPwdErr('')
    setPwdMsg('')

    if (pwdForm.newPwd.length < 6) {
      setPwdErr('New password must be at least 6 characters')
      return
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdErr('New passwords do not match')
      return
    }

    setPwdSaving(true)
    try {
      await API.put('/api/auth/password', {
        currentPassword: pwdForm.current,
        newPassword:     pwdForm.newPwd,
      })
      setPwdMsg('Password changed successfully!')
      setPwdForm({ current: '', newPwd: '', confirm: '' })
    } catch (err) {
      setPwdErr(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setPwdSaving(false)
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault()
    setCreateMsg('')
    setCreateErr('')

    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setCreateErr('Name, email, and password are required.')
      return
    }

    setCreateSaving(true)
    try {
      const { data } = await API.post('/api/admin/create-admin', newAdmin)
      setCreateMsg(data?.message || 'New admin created successfully!')
      setNewAdmin({ name: '', email: '', phone: '', password: '' })
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create admin account.')
    } finally {
      setCreateSaving(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2>My Profile</h2>
          <p>View and manage your administrator account details.</p>
        </div>
        {!editing && (
          <button className="btn-primary btn-sm" onClick={() => setEditing(true)}>
            ✏ Edit Profile
          </button>
        )}
      </div>

      {/* Success / Error banners */}
      {saved && (
        <div style={{ background:'var(--status-resolved-bg)', color:'var(--status-resolved-text)', padding:'12px 20px', borderRadius:'var(--radius-sm)', marginBottom:20, fontWeight:600, fontSize:'0.9rem' }}>
          ✅ Profile saved successfully!
        </div>
      )}
      {saveErr && (
        <div style={{ background:'#fef2f2', color:'#dc2626', padding:'12px 20px', borderRadius:'var(--radius-sm)', marginBottom:20, fontWeight:600, fontSize:'0.9rem' }}>
          ⚠️ {saveErr}
        </div>
      )}

      {/* Profile + Password grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:24 }}>

        {/* Avatar Card */}
        <div className="panel">
          <div className="panel-body" style={{ textAlign:'center', padding:32 }}>
            <div className="profile-avatar-circle">{initials}</div>
            <div style={{ fontWeight:800, fontSize:'1.2rem', marginTop:16 }}>{form.name}</div>
            <div style={{ color:'var(--text-light)', fontSize:'0.85rem', marginTop:4 }}>
              System Administrator
            </div>
            <div className="profile-chip" style={{ marginTop:12 }}>
              <span style={{ color:'var(--status-resolved-text)' }}>● Active</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="panel">
          <div className="panel-header"><h3>Personal Information</h3></div>
          <div className="panel-body">
            <form onSubmit={handleSave} noValidate>
              <div className="report-form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Email <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(read-only)</span></label>
                  <input
                    type="email"
                    value={adminEmail}
                    disabled
                    style={{ opacity:0.7, cursor:'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" value="Administrator" disabled style={{ opacity:0.7 }} />
                </div>
              </div>
              {editing && (
                <div style={{ display:'flex', gap:12, marginTop:16 }}>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? '⏳ Saving…' : '💾 Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => { setEditing(false); setForm({ name: adminName, phone: adminPhone }); setSaveErr('') }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="panel" style={{ marginTop:24, maxWidth:600 }}>
        <div className="panel-header"><h3>🔒 Change Password</h3></div>
        <div className="panel-body">
          {pwdMsg && (
            <div style={{ background:'var(--status-resolved-bg)', color:'var(--status-resolved-text)', padding:'10px 16px', borderRadius:8, fontSize:'0.85rem', marginBottom:16, fontWeight:600 }}>
              {pwdMsg}
            </div>
          )}
          {pwdErr && (
            <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 16px', borderRadius:8, fontSize:'0.85rem', marginBottom:16, border:'1px solid #fecaca' }}>
              {pwdErr}
            </div>
          )}
          <form onSubmit={handlePassword} noValidate>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={pwdForm.current}
                  onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={pwdForm.newPwd}
                  onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop:16 }} disabled={pwdSaving}>
              {pwdSaving ? '⏳ Changing…' : '🔑 Change Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="panel" style={{ marginTop:24, maxWidth:700 }}>
        <div className="panel-header"><h3>🛡 Create Another Admin</h3></div>
        <div className="panel-body">
          {createMsg && (
            <div style={{ background:'var(--status-resolved-bg)', color:'var(--status-resolved-text)', padding:'10px 16px', borderRadius:8, fontSize:'0.85rem', marginBottom:16, fontWeight:600 }}>
              {createMsg}
            </div>
          )}
          {createErr && (
            <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 16px', borderRadius:8, fontSize:'0.85rem', marginBottom:16, border:'1px solid #fecaca' }}>
              {createErr}
            </div>
          )}

          <form onSubmit={handleCreateAdmin} noValidate>
            <div className="report-form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="New admin name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="admin@example.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={newAdmin.phone} onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Temporary Password</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop:16 }} disabled={createSaving}>
              {createSaving ? '⏳ Creating…' : 'Create Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
