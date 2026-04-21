import { useState, useRef } from 'react'

const blocks = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E']
const categories = [
  'Road & Infrastructure', 'Garbage & Sanitation', 'Water Supply',
  'Electricity & Lighting', 'Public Safety', 'Drainage', 'Other'
]

export default function ReportIssue({ onSubmit, onCancel, citizen }) {
  const [form, setForm] = useState({
    title: '', category: '', priority: '', block: citizen?.block || '',
    address: '', coordinates: '', description: '', date: '', time: '', image: null,
  })
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setForm(prev => ({ ...prev, image: file }))
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function validate() {
    const errs = {}
    if (form.title.trim().length < 5)        errs.title       = 'Min 5 characters'
    if (!form.category)                       errs.category    = 'Select a category'
    if (!form.priority)                       errs.priority    = 'Select a priority'
    if (!form.block)                          errs.block       = 'Select a block'
    if (form.address.trim().length < 5)       errs.address     = 'Enter a valid address'
    if (form.description.trim().length < 20)  errs.description = 'Min 20 characters'
    if (!form.date)                           errs.date        = 'Required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitting(true)
    setTimeout(() => {
      onSubmit(form)
      setSubmitting(false)
    }, 600)
  }

  function reset() {
    setForm({ title:'', category:'', priority:'', block: citizen?.block||'', address:'', coordinates:'', description:'', date:'', time:'', image:null })
    setPreview(null)
    setErrors({})
  }

  return (
    <div className="report-page">
      <div className="page-section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p className="eyebrow">Report Issue</p>
          <h2>Submit a New Urban Issue</h2>
          <p>Provide as much detail as possible so block officers can prioritize quickly.</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-ghost btn-sm" onClick={reset}>Reset</button>
          <button className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="panel">
          <div className="panel-header"><h3>Issue Details</h3></div>
          <div className="panel-body">
            <div className="report-form-grid">
              {/* Title */}
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label>Issue Title *</label>
                <input type="text" placeholder="E.g., Pothole blocking Main Street" maxLength={80}
                  value={form.title} onChange={set('title')} className={errors.title ? 'error' : ''} />
                {errors.title && <span className="field-error">{errors.title}</span>}
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={set('category')} className={errors.category ? 'error' : ''}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              {/* Priority */}
              <div className="form-group">
                <label>Priority *</label>
                <select value={form.priority} onChange={set('priority')} className={errors.priority ? 'error' : ''}>
                  <option value="">Select priority</option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
                {errors.priority && <span className="field-error">{errors.priority}</span>}
              </div>

              {/* Block */}
              <div className="form-group">
                <label>Block *</label>
                <select value={form.block} onChange={set('block')} className={errors.block ? 'error' : ''}>
                  <option value="">Select block</option>
                  {blocks.map(b => <option key={b}>{b}</option>)}
                </select>
                {errors.block && <span className="field-error">{errors.block}</span>}
              </div>

              {/* Address */}
              <div className="form-group">
                <label>Location / Address *</label>
                <input type="text" placeholder="E.g., 45 Market Street, Ward 12"
                  value={form.address} onChange={set('address')} className={errors.address ? 'error' : ''} />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>

              {/* Coordinates */}
              <div className="form-group">
                <label>Location Coordinates <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(Optional)</span></label>
                <input type="text" placeholder="E.g., 12.9716, 77.5946"
                  value={form.coordinates} onChange={set('coordinates')} />
              </div>

              {/* Date */}
              <div className="form-group">
                <label>Date Observed *</label>
                <input type="date" value={form.date} onChange={set('date')} className={errors.date ? 'error' : ''} max={new Date().toISOString().split('T')[0]} />
                {errors.date && <span className="field-error">{errors.date}</span>}
              </div>

              {/* Time */}
              <div className="form-group">
                <label>Time Observed</label>
                <input type="time" value={form.time} onChange={set('time')} />
              </div>

              {/* Description */}
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label>Detailed Description * <span style={{ color:'var(--text-muted)', fontWeight:400 }}>({form.description.length}/500)</span></label>
                <textarea rows={5} maxLength={500}
                  placeholder="Describe the issue, its impact, and any context that helps the officer."
                  value={form.description} onChange={set('description')} className={errors.description ? 'error' : ''} />
                {errors.description && <span className="field-error">{errors.description}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="panel" style={{ marginTop:20 }}>
          <div className="panel-header"><h3>📷 Attach Photo <span style={{ fontWeight:400, color:'var(--text-light)', fontSize:'0.85rem' }}>(optional)</span></h3></div>
          <div className="panel-body">
            <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="preview" className="photo-preview-img" />
              ) : (
                <div className="photo-upload-placeholder">
                  <span className="photo-upload-icon">📁</span>
                  <p>Click to upload a photo</p>
                  <small>JPG, PNG, WEBP — max 5 MB</small>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage} />
            </div>
            {preview && (
              <button type="button" className="btn-ghost btn-sm" style={{ marginTop:10 }}
                onClick={() => { setPreview(null); setForm(prev=>({...prev,image:null})) }}>
                Remove Photo
              </button>
            )}
          </div>
        </div>

        <div style={{ display:'flex', gap:12, marginTop:24 }}>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth:180 }}>
            {submitting ? '⏳ Submitting…' : '✅ Submit Report'}
          </button>
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
