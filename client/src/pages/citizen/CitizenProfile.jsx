import { useState } from 'react'
import { blocks, officers } from '../../data/mockData'

export default function CitizenProfile({ citizen }) {
  const [form, setForm] = useState({ ...citizen })
  const [editing, setEditing]  = useState(false)
  const [saved,   setSaved]    = useState(false)
  const [errors,  setErrors]   = useState({})

  const myOfficer = officers.find(o => o.block === form.block)

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
    setSaved(false)
  }

  function validate() {
    const errs = {}
    if (form.name.trim().length < 3)  errs.name  = 'Min 3 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (form.phone.trim().length < 10) errs.phone = 'Min 10 digits'
    if (form.address.trim().length < 5) errs.address = 'Required'
    if (form.city.trim().length < 2)   errs.city  = 'Required'
    if (!/^\d{4,10}$/.test(form.zip)) errs.zip   = 'Invalid pin/zip'
    return errs
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setEditing(false)
    setSaved(true)
  }

  return (
    <div>
      <div className="page-section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p className="eyebrow">My Profile</p>
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
                  <label>Email</label>
                  <input type="email" value={form.email}  onChange={set('email')}   disabled={!editing} className={errors.email ? 'error':''} />
                  {errors.email && <span className="field-error">{errors.email}</span>}
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
                  <button type="submit" className="btn-primary">💾 Save Changes</button>
                  <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setForm({...citizen}); setErrors({}) }}>Cancel</button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Block Officer Contact */}
      {myOfficer && (
        <div className="panel" style={{ marginTop:24 }}>
          <div className="panel-header"><h3>📞 Your Assigned Block Officer</h3></div>
          <div className="panel-body">
            <div className="officer-contact-inner">
              <div className="officer-avatar-lg">{myOfficer.avatar}</div>
              <div>
                <div className="officer-name">{myOfficer.name}</div>
                <div className="officer-block">{myOfficer.block}</div>
                <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
                  <a href={`mailto:${myOfficer.email}`} className="officer-contact-link btn-ghost btn-sm">✉ Email</a>
                  <a href={`tel:${myOfficer.phone}`}    className="officer-contact-link btn-ghost btn-sm">📞 Call</a>
                </div>
                <div style={{ marginTop:8, fontSize:'0.82rem', color:'var(--text-light)' }}>
                  {myOfficer.email} · {myOfficer.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
