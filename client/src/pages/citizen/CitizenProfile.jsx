import { useState, useEffect } from 'react'
import { blocks } from '../../data/mockData'
import API from '../../api/axios'

function mailtoHref(value) {
  const raw = String(value || '').trim()
  const email = raw.match(/<([^>]+)>/)?.[1] || raw
  return `mailto:${email.trim()}`
}

export default function CitizenProfile({ citizen }) {
  const [form, setForm]       = useState({ ...citizen })
  const [editing, setEditing] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [officer, setOfficer] = useState(null)
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  // Fetch the block officer assigned to citizen's block
  useEffect(() => {
    async function fetchOfficer() {
      try {
        const { data } = await API.get('/api/admin/officers')
        const match = data.find(o => o.assignedBlock === (form.block || citizen.block))
        setOfficer(match || null)
      } catch (err) {
        // Not critical — officer section just won't show
      }
    }
    fetchOfficer()
  }, [form.block, citizen.block])

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
    setSaved(false)
    setSaveErr('')
  }

  function validate() {
    const errs = {}
    if (form.name.trim().length < 3)  errs.name  = 'Min 3 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (form.phone.trim().length < 10) errs.phone = 'Min 10 digits'
    if (form.address.trim().length < 5) errs.address = 'Required'
    if (form.city.trim().length < 2)   errs.city  = 'Required'
    if (!/^\d{4,10}$/.test(form.zip || '')) errs.zip = 'Invalid pin/zip'
    return errs
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    setSaveErr('')
    try {
      const { data } = await API.put('/api/auth/profile', {
        name:    form.name,
        phone:   form.phone,
        address: form.address,
        city:    form.city,
        pincode: form.zip,
        block:   form.block,
      })
      // Update sessionStorage with latest user info
      const stored = JSON.parse(sessionStorage.getItem('uv_user') || '{}')
      sessionStorage.setItem('uv_user', JSON.stringify({ ...stored, ...data }))
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to save profile. Please try again.')
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
          <h2>Citizen Details</h2>
          <p>Keep your contact info up to date so officers can reach you.</p>
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
        {/* Avatar Card */}
        <div className="panel">
          <div className="panel-body" style={{ textAlign:'center', padding:32 }}>
            <div className="profile-avatar-circle">
              {form.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div style={{ fontWeight:800, fontSize:'1.2rem', marginTop:16 }}>{form.name}</div>
            <div style={{ color:'var(--text-light)', fontSize:'0.85rem', marginTop:4 }}>Citizen · {form.block}</div>
            <div className="profile-chip" style={{ marginTop:12 }}>
              <span style={{ color:'var(--status-resolved-text)' }}>● Active</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="panel">
          <div className="panel-header"><h3>Personal Information</h3></div>
          <div className="panel-body">
            <form onSubmit={handleSave} noValidate>
              <div className="report-form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.name}    onChange={set('name')}    disabled={!editing} className={errors.name ? 'error':''} />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Email <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(read-only)</span></label>
                  <input type="email" value={form.email} disabled style={{ opacity:0.7, cursor:'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={form.phone}    onChange={set('phone')}   disabled={!editing} className={errors.phone ? 'error':''} />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label>Block</label>
                  {editing ? (
                    <select value={form.block} onChange={set('block')}>
                      {blocks.map(b => <option key={b}>{b}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form.block} disabled />
                  )}
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label>Address</label>
                  <input type="text" value={form.address} onChange={set('address')} disabled={!editing} className={errors.address ? 'error':''} />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={form.city}    onChange={set('city')}    disabled={!editing} className={errors.city ? 'error':''} />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input type="text" value={form.zip}     onChange={set('zip')}     disabled={!editing} className={errors.zip ? 'error':''} />
                  {errors.zip && <span className="field-error">{errors.zip}</span>}
                </div>
              </div>
              {editing && (
                <div style={{ display:'flex', gap:12, marginTop:16 }}>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? '⏳ Saving…' : '💾 Save Changes'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setForm({...citizen}); setErrors({}); setSaveErr('') }}>Cancel</button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Block Officer Contact — fetched from backend */}
      {officer && (
        <div className="panel" style={{ marginTop:24 }}>
          <div className="panel-header"><h3>📞 Your Assigned Block Officer</h3></div>
          <div className="panel-body">
            <div className="officer-contact-inner">
              <div className="officer-avatar-lg">
                {officer.avatar || (officer.name || 'OF').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <div className="officer-name">{officer.name}</div>
                <div className="officer-block">{officer.assignedBlock}</div>
                <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
                  <a href={mailtoHref(officer.email)} className="officer-contact-link btn-ghost btn-sm">✉ Email</a>
                  <a href={`tel:${officer.phone}`}    className="officer-contact-link btn-ghost btn-sm">📞 Call</a>
                </div>
                <div style={{ marginTop:8, fontSize:'0.82rem', color:'var(--text-light)' }}>
                  {officer.email} · {officer.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
