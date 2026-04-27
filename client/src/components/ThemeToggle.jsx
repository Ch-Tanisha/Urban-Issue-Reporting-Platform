import { useEffect, useState } from 'react'

const THEME_KEY = 'uv_theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function initializeTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  const preferred = saved || 'light'
  applyTheme(preferred)
  return preferred
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`.trim()}
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span>{theme === 'light' ? '🌙' : '☀️'}</span>
      <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
