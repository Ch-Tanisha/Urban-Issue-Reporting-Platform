import { useState } from 'react'
import API from '../../api/axios'

export default function OfficerProfile({ officer }) {
  const [form, setForm] = useState({ name: officer.name, phone: officer.phone })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  const initials = (form.name || 'OF').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    try {
      const { data } = await API.put('/api/auth/profile', {
        name: form.name,
        phone: form.phone,
      })
      const stored = JSON.parse(sessionStorage.getItem('uv_user') || '{}')
      sessionStorage.setItem('uv_user', JSON.stringify({ ...stored, ...data }))
      setSaved(true)
      setEditing(false)
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

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
        newPassword: pwdForm.newPwd,
      })
      setPwdMsg('Password changed successfully!')
      setPwdForm({ current: '', newPwd: '', confirm: '' })
    } catch (err) {
      setPwdErr(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div>
      <div className="page-section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2>Officer Details</h2>
          <p>Your profile and assignment information.</p>
        </div>
        {!editing && <button className="btn-primary btn-sm" onClick={() => setEditing(true)}>✏ Edit Profile</button>}
      </div>

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

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:24 }}>
        <div className="panel">
          <div className="panel-body" style={{ textAlign:'center', padding:32 }}>
            <div className="profile-avatar-circle">{initials}</div>
            <div style={{ fontWeight:800, fontSize:'1.2rem', marginTop:16 }}>{form.name}</div>
            <div style={{ color:'var(--text-light)', fontSize:'0.85rem', marginTop:4 }}>Block Officer · {officer.block}</div>
            <div className="profile-chip" style={{ marginTop:12 }}>
              <span style={{ color:'var(--status-resolved-text)' }}>● Active</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Assignment Info</h3></div>
          <div className="panel-body">
            <form onSubmit={handleSave} noValidate>
              <div className="report-form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>Email <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(read-only)</span></label>
                  <input type="email" value={officer.email} disabled style={{ opacity:0.7, cursor:'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={!editing} />
                </div>
                <div className="form-group">
                  <label>Assigned Block</label>
                  <input type="text" value={officer.block} disabled style={{ opacity:0.7 }} />
                </div>
              </div>

              {editing && (
                <div style={{ display:'flex', gap:12, marginTop:16 }}>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? '⏳ Saving…' : '💾 Save Changes'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setForm({ name: officer.name, phone: officer.phone }); setSaveErr('') }}>
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

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
                <input type="password" value={pwdForm.current} onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })} placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwdForm.newPwd} onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Re-enter new password" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop:16 }} disabled={pwdSaving}>
              {pwdSaving ? '⏳ Changing…' : '🔑 Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
