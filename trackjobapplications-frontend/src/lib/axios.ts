import axios from 'axios'
import { API_BASE } from './config'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true,      // Send httpOnly JWT cookies automatically
  xsrfCookieName: 'csrftoken', // Read Django's CSRF cookie
  xsrfHeaderName: 'X-CSRFToken', // Send as X-CSRFToken header on every mutating request
})

let refreshPromise: Promise<void> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let csrfPromise: Promise<void> | null = null

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function hasCsrfCookie(): boolean {
  return document.cookie.split('; ').some(c => c.startsWith('csrftoken='))
}

async function ensureCsrfCookie(): Promise<void> {
  if (hasCsrfCookie()) return
  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${API_BASE}/csrf/`, { withCredentials: true })
      .then(() => { csrfPromise = null })
      .catch(() => { csrfPromise = null })
  }
  return csrfPromise
}

api.interceptors.request.use(async (config) => {
  if (config.method && MUTATING_METHODS.has(config.method.toLowerCase())) {
    await ensureCsrfCookie()
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        if (!refreshPromise) {
          if (refreshTimer) clearTimeout(refreshTimer)
          // No body needed — refresh cookie is sent automatically via withCredentials
          refreshPromise = axios
            .post(
              `${API_BASE}/auth/token/refresh/`,
              {},
              { withCredentials: true },
            )
            .then(() => {
              refreshTimer = setTimeout(() => { refreshPromise = null }, 500)
            })
            .catch((err) => {
              refreshPromise = null
              throw err
            })
        }
        await refreshPromise
        return api(original)
      } catch {
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    }
    return Promise.reject(error)
  },
)

export default api
