import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  // needed so httpOnly cookies travel cross-origin
})

// Attach the JWT token to every outgoing request.
// We store tokens in sessionStorage (per-tab), so different browser
// tabs can hold different role sessions without overwriting each other.
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('uv_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Only force-logout when the token itself is invalid (auth endpoints),
// not when a regular data fetch returns 401 due to permissions.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || ''
      const isAuthEndpoint =
        url.includes('/api/auth/me') ||
        url.includes('/api/auth/login')

      if (isAuthEndpoint) {
        sessionStorage.removeItem('uv_token')
        sessionStorage.removeItem('uv_user')
        sessionStorage.removeItem('uv_role')
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

export default API
