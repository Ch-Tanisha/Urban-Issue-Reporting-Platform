import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('uv_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

// Response interceptor — handle 401 (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('uv_token')
      localStorage.removeItem('uv_user')
      localStorage.removeItem('uv_role')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default API
