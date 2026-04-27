import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import ThemeToggle from '../components/ThemeToggle'
import './auth.css'

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E']

function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function validatePhone(v) { return /^[+]?[\d\s\-]{10,}$/.test(v) }
function passwordStrength(p) {
  let s = 0
  if (p.length >= 8) s++
  if (/[a-z]/.test(p)) s++
  if (/[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return s
}

// Clear current tab session before fresh login/signup.
function clearSession() {
  sessionStorage.removeItem('uv_token')
  sessionStorage.removeItem('uv_user')
  sessionStorage.removeItem('uv_role')
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [showPwd, setShowPwd] = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const [login, setLogin] = useState({ email: '', password: '', role: '' })

  const [signup, setSignup] = useState({
    name: '', age: '', gender: '', email: '', phone: '',
    address: '', city: '', pincode: '', block: '',
    password: '', confirmPass: '', role: 'citizen', terms: false,
  })

  const pwdStr = passwordStrength(signup.password)
  const pwdColors = ['#e2e8f0', '#dc2626', '#f59e0b', '#fbbf24', '#059669', '#059669']
  const pwdLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']

  async function handleLogin(e) {
    e.preventDefault()
    setServerError('')
    const errs = {}
    if (!login.email) errs.email = 'Required'
    else if (!validateEmail(login.email) && !validatePhone(login.email)) errs.email = 'Invalid email or phone'
    if (!login.password) errs.password = 'Required'
    if (!login.role) errs.role = 'Select a role'
    setErrors(errs)
    if (Object.keys(errs).length) return

    clearSession()

    setLoading(true)
    try {
      // Each role has its own login endpoint.
      const roleEndpoints = {
        citizen: '/api/auth/login/citizen',
        officer: '/api/auth/login/officer',
        admin:   '/api/auth/login/admin'
      }
      const endpoint = roleEndpoints[login.role] || '/api/auth/login'

      const { data } = await API.post(endpoint, {
        email:    login.email,
        password: login.password
      })

      // Store auth details for protected dashboard routing.
      sessionStorage.setItem('uv_token', data.token)
      const frontendRole = data.user.role === 'blockofficer' ? 'officer' : data.user.role
      sessionStorage.setItem('uv_role', frontendRole)
      sessionStorage.setItem('uv_user', JSON.stringify(data.user))

      const routes = { citizen: '/citizen', officer: '/officer', admin: '/admin' }
      navigate(routes[frontendRole] || '/citizen')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials and selected role.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setServerError('')
    const errs = {}
    if (signup.name.trim().length < 3) errs.name = 'Min 3 characters'
    if (!signup.age || Number(signup.age) < 18) errs.age = 'Must be 18+'
    if (!signup.gender) errs.gender = 'Required'
    if (!validateEmail(signup.email)) errs.email = 'Invalid email'
    if (!validatePhone(signup.phone)) errs.phone = 'Min 10 digits'
    if (signup.address.trim().length < 10) errs.address = 'Full address required'
    if (signup.city.trim().length < 2) errs.city = 'Required'
    if (!/^\d{6}$/.test(signup.pincode)) errs.pincode = '6-digit pincode required'
    if (!signup.block) errs.block = 'Select a block'
    if (pwdStr < 3) errs.password = 'Password too weak'
    if (signup.password !== signup.confirmPass) errs.confirmPass = 'Passwords do not match'
    if (!signup.terms) errs.terms = 'Accept terms to continue'
    setErrors(errs)
    if (Object.keys(errs).length) return

    clearSession()

    setLoading(true)
    try {
      const { data } = await API.post('/api/auth/register', {
        name: signup.name,
        email: signup.email,
        password: signup.password,
        phone: signup.phone,
        role: 'citizen',
        age: Number(signup.age),
        gender: signup.gender,
        address: signup.address,
        city: signup.city,
        pincode: signup.pincode,
        block: signup.block
      })

      sessionStorage.setItem('uv_token', data.token)
      const frontendRole = data.user.role === 'blockofficer' ? 'officer' : data.user.role
      sessionStorage.setItem('uv_role', frontendRole)
      sessionStorage.setItem('uv_user', JSON.stringify(data.user))

      const routes = { citizen: '/citizen', officer: '/officer', admin: '/admin' }
      navigate(routes[frontendRole] || '/citizen')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const set = (setter) => (field) => (e) => {
    setter(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
    setServerError('')
  }

  return (
    <div className="auth-root">
      <div className="auth-image-panel">
        <div className="auth-image-content">
          <h1>Your Voice,<br />Your City</h1>
          <p>Transforming communities one report at a time. Join thousands making a real difference in urban development.</p>
          <div className="auth-badges">
            <div className="auth-badge"><div className="auth-badge-num">10,000+</div><div className="auth-badge-lbl">Issues Resolved</div></div>
            <div className="auth-badge"><div className="auth-badge-num">95%</div><div className="auth-badge-lbl">Response Rate</div></div>
            <div className="auth-badge"><div className="auth-badge-num">500+</div><div className="auth-badge-lbl">Active Citizens</div></div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div style={{ position:'absolute', top:16, right:20 }}>
          <ThemeToggle />
        </div>

        {mode === 'login' ? (
          <div className="auth-form-inner animate-fadeInUp">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account</p>

            {serverError && <div className="auth-server-error" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 16px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>{serverError}</div>}

            <form onSubmit={handleLogin} noValidate>
              <div className="auth-field">
                <label>Email / Phone</label>
                <input type="text" placeholder="Enter email or phone"
                  value={login.email} onChange={set(setLogin)('email')}
                  className={errors.email ? 'err' : ''} />
                {errors.email && <span className="auth-err">{errors.email}</span>}
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-pwd">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Enter password"
                    value={login.password} onChange={set(setLogin)('password')}
                    className={errors.password ? 'err' : ''} />
                  <button type="button" className="auth-eye" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className="auth-err">{errors.password}</span>}
              </div>

              <div className="auth-field">
                <label>Login as</label>
                <select value={login.role} onChange={set(setLogin)('role')} className={errors.role ? 'err' : ''}>
                  <option value="">Select role</option>
                  <option value="citizen">Citizen</option>
                  <option value="officer">Block Officer</option>
                  <option value="admin">Administrator</option>
                </select>
                {errors.role && <span className="auth-err">{errors.role}</span>}
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? '⏳ Signing in…' : 'Login →'}
              </button>
            </form>
            <p className="auth-switch">Don't have an account? <button onClick={() => { setMode('signup'); setErrors({}); setServerError('') }}>Sign up</button></p>
          </div>

        ) : (
          <div className="auth-form-inner animate-fadeInUp">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join our community</p>

            {serverError && <div className="auth-server-error" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 16px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>{serverError}</div>}

            <div className="auth-scroll-area">
              <form onSubmit={handleSignup} noValidate>
                <div className="auth-field">
                  <label>Full Name *</label>
                  <input type="text" placeholder="Your full name"
                    value={signup.name} onChange={set(setSignup)('name')}
                    className={errors.name ? 'err' : ''} />
                  {errors.name && <span className="auth-err">{errors.name}</span>}
                </div>

                <div className="auth-row">
                  <div className="auth-field">
                    <label>Age *</label>
                    <input type="number" placeholder="Age" min="18"
                      value={signup.age} onChange={set(setSignup)('age')}
                      className={errors.age ? 'err' : ''} />
                    {errors.age && <span className="auth-err">{errors.age}</span>}
                  </div>
                  <div className="auth-field">
                    <label>Gender *</label>
                    <select value={signup.gender} onChange={set(setSignup)('gender')} className={errors.gender ? 'err' : ''}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                    {errors.gender && <span className="auth-err">{errors.gender}</span>}
                  </div>
                </div>

                <div className="auth-field">
                  <label>Email *</label>
                  <input type="email" placeholder="your@email.com"
                    value={signup.email} onChange={set(setSignup)('email')}
                    className={errors.email ? 'err' : ''} />
                  {errors.email && <span className="auth-err">{errors.email}</span>}
                </div>

                <input type="hidden" value="citizen" />


                <div className="auth-row">
                  <div className="auth-field">
                    <label>Phone *</label>
                    <input type="tel" placeholder="+91 XXXXX XXXXX"
                      value={signup.phone} onChange={set(setSignup)('phone')}
                      className={errors.phone ? 'err' : ''} />
                    {errors.phone && <span className="auth-err">{errors.phone}</span>}
                  </div>
                  <div className="auth-field">
                    <label>Block *</label>
                    <select value={signup.block} onChange={set(setSignup)('block')} className={errors.block ? 'err' : ''}>
                      <option value="">Select block</option>
                      {BLOCKS.map(b => <option key={b}>{b}</option>)}
                    </select>
                    {errors.block && <span className="auth-err">{errors.block}</span>}
                  </div>
                </div>

                <div className="auth-field">
                  <label>Address *</label>
                  <textarea placeholder="Full address" rows={2}
                    value={signup.address} onChange={set(setSignup)('address')}
                    className={errors.address ? 'err' : ''} />
                  {errors.address && <span className="auth-err">{errors.address}</span>}
                </div>

                <div className="auth-row">
                  <div className="auth-field">
                    <label>City *</label>
                    <input type="text" placeholder="City"
                      value={signup.city} onChange={set(setSignup)('city')}
                      className={errors.city ? 'err' : ''} />
                    {errors.city && <span className="auth-err">{errors.city}</span>}
                  </div>
                  <div className="auth-field">
                    <label>Pincode *</label>
                    <input type="text" placeholder="6-digit" maxLength={6}
                      value={signup.pincode} onChange={set(setSignup)('pincode')}
                      className={errors.pincode ? 'err' : ''} />
                    {errors.pincode && <span className="auth-err">{errors.pincode}</span>}
                  </div>
                </div>

                <div className="auth-field">
                  <label>Password *</label>
                  <div className="auth-pwd">
                    <input type={showPwd ? 'text' : 'password'} placeholder="Strong password"
                      value={signup.password} onChange={set(setSignup)('password')}
                      className={errors.password ? 'err' : ''} />
                    <button type="button" className="auth-eye" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div className="auth-strength-bar">
                    <div style={{ width: `${(pwdStr / 5) * 100}%`, background: pwdColors[pwdStr], height: '100%', borderRadius: 2, transition: 'all 0.3s' }} />
                  </div>
                  {signup.password && <span style={{ fontSize: '0.75rem', color: pwdColors[pwdStr] }}>{pwdLabels[pwdStr]}</span>}
                  {errors.password && <span className="auth-err">{errors.password}</span>}
                </div>

                <div className="auth-field">
                  <label>Confirm Password *</label>
                  <div className="auth-pwd">
                    <input type={showPwd2 ? 'text' : 'password'} placeholder="Re-enter password"
                      value={signup.confirmPass} onChange={set(setSignup)('confirmPass')}
                      className={errors.confirmPass ? 'err' : ''} />
                    <button type="button" className="auth-eye" onClick={() => setShowPwd2(!showPwd2)}>
                      {showPwd2 ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.confirmPass && <span className="auth-err">{errors.confirmPass}</span>}
                </div>

                <div className="auth-checkbox">
                  <input type="checkbox" id="terms" checked={signup.terms} onChange={set(setSignup)('terms')} />
                  <label htmlFor="terms">I agree to the <a href="#">Terms &amp; Privacy Policy</a></label>
                </div>
                {errors.terms && <span className="auth-err">{errors.terms}</span>}

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? '⏳ Creating Account…' : 'Create Account →'}
                </button>
              </form>
            </div>
            <p className="auth-switch">Already have an account? <button onClick={() => { setMode('login'); setErrors({}); setServerError('') }}>Login</button></p>
          </div>
        )}
      </div>
    </div>
  )
}
