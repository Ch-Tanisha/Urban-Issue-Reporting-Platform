import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './landing.css'

const FEATURES = [
  { icon: '📝', title: 'Easy Issue Reporting', desc: 'Simple form to report urban issues with exact location and photo upload support.' },
  { icon: '📊', title: 'Real-Time Tracking',   desc: 'Track your reported issues from submission to resolution with live status updates.' },
  { icon: '📞', title: 'Direct Contact',        desc: 'Access your block officer\'s contact information for follow-ups and queries.' },
  { icon: '🎯', title: 'Role-Based Dashboards', desc: 'Separate interfaces for citizens, block officers, and urban administrators.' },
  { icon: '📈', title: 'Analytics & Insights',  desc: 'View comprehensive statistics and trends for urban issue management.' },
  { icon: '🔒', title: 'Secure Platform',       desc: 'Your data is protected with secure authentication and role-based access.' },
]

const CATEGORIES = [
  { icon: '🚧', label: 'Potholes & Roads' },
  { icon: '💡', label: 'Streetlights'     },
  { icon: '🗑️', label: 'Sanitation'       },
  { icon: '💧', label: 'Water Supply'     },
  { icon: '🏗️', label: 'Infrastructure'  },
  { icon: '🚨', label: 'Public Safety'    },
]

const STEPS = [
  { n: '1', title: 'Register & Login',   desc: 'Create your account and access the platform securely.' },
  { n: '2', title: 'Report Issue',        desc: 'Fill out the form with exact location and upload photos.' },
  { n: '3', title: 'Track Progress',      desc: 'Monitor the status of your report from submission to resolution.' },
  { n: '4', title: 'Issue Resolved',      desc: 'Get notified when your block officer resolves the issue.' },
]

const STATS = [
  { count: 1250, label: 'Issues Reported' },
  { count: 892,  label: 'Issues Resolved' },
  { count: 450,  label: 'Active Citizens' },
  { count: 25,   label: 'Blocks Covered'  },
]

function useCountUp(target, active) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let current = 0
    const step = Math.ceil(target / 60)
    const id = setInterval(() => {
      current = Math.min(current + step, target)
      setVal(current)
      if (current >= target) clearInterval(id)
    }, 25)
    return () => clearInterval(id)
  }, [active, target])
  return val
}

function StatNumber({ count, label }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const val = useCountUp(count, active)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div className="lp-stat" ref={ref}>
      <div className="lp-stat-number">{val.toLocaleString()}+</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState(null)

  return (
    <div className="lp-root">
      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" className="lp-logo">
            <div className="lp-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <span>UrbanVoice</span>
          </a>
          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#categories">Categories</a></li>
            <li><a href="#impact">Impact</a></li>
          </ul>
          <button className="lp-login-btn" onClick={() => navigate('/auth')}>Login</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-content animate-fadeInUp">
          <span className="lp-hero-badge">🏙️ Urban Issue Management Platform</span>
          <h1 className="lp-hero-title">Report Urban Issues,<br />Drive Real Change</h1>
          <p className="lp-hero-sub">
            Help improve your city by reporting potholes, broken streetlights, and sanitation issues directly to your block officer. Track progress and make a difference.
          </p>
          <div className="lp-hero-btns">
            <button className="btn-primary" style={{ padding:'14px 32px', fontSize:'1rem' }} onClick={() => navigate('/auth')}>
              Get Started Free
            </button>
            <a href="#how-it-works" className="btn-ghost" style={{ padding:'14px 32px', fontSize:'1rem', border:'2px solid rgba(255,255,255,0.4)', color:'white' }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section lp-features" id="features">
        <div className="lp-container">
          <p className="lp-eyebrow">What We Offer</p>
          <h2 className="lp-section-title">Key Features</h2>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`lp-feature-card ${activeFeature === i ? 'active' : ''}`}
                onClick={() => setActiveFeature(activeFeature === i ? null : i)}
              >
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section lp-how" id="how-it-works">
        <div className="lp-container">
          <p className="lp-eyebrow">Simple Process</p>
          <h2 className="lp-section-title">How It Works</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={i}>
                <div className="lp-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="lp-section lp-categories" id="categories">
        <div className="lp-container">
          <p className="lp-eyebrow">Issue Types</p>
          <h2 className="lp-section-title">Report Any Urban Issue</h2>
          <div className="lp-cat-grid">
            {CATEGORIES.map((c, i) => (
              <div className="lp-cat-card" key={i}>
                <div className="lp-cat-icon">{c.icon}</div>
                <h3>{c.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats" id="impact">
        <div className="lp-container">
          <p className="lp-eyebrow" style={{ color:'rgba(255,255,255,0.7)' }}>Our Impact</p>
          <h2 className="lp-section-title" style={{ color:'white' }}>Making a Difference</h2>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => <StatNumber key={i} count={s.count} label={s.label} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-container" style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:'2.2rem', fontWeight:800, color:'white', marginBottom:12 }}>
            Ready to Make a Difference?
          </h2>
          <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'1.1rem', marginBottom:32 }}>
            Join thousands of citizens working together to improve their city.
          </p>
          <button className="btn-primary" style={{ padding:'16px 40px', fontSize:'1.05rem' }} onClick={() => navigate('/auth')}>
            Get Started Today
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <h3>UrbanVoice</h3>
              <p>Empowering citizens to report urban issues and drive positive change in their communities.</p>
            </div>
            <div>
              <h3>Quick Links</h3>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#categories">Categories</a>
              <a href="#impact">Impact</a>
            </div>
            <div>
              <h3>Support</h3>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
            <div>
              <h3>Connect</h3>
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">Instagram</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2025 UrbanVoice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
