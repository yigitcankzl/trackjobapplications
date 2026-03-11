import axios from 'axios'
import { API_BASE } from './config'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true, // Send httpOnly JWT cookies automatically
})

let refreshPromise: Promise<void> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

// CSRF token stored in memory — JS cannot read cross-origin cookies via document.cookie,
// so we fetch the token from the backend response body and set it manually as a header.
let csrfToken: string | null = null
let csrfPromise: Promise<void> | null = null

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

async function ensureCsrfToken(): Promise<void> {
  if (csrfToken) return
  if (!csrfPromise) {
    csrfPromise = axios
      .get<{ csrfToken: string }>(`${API_BASE}/csrf/`, { withCredentials: true })
      .then(({ data }) => {
        csrfToken = data.csrfToken
        csrfPromise = null
      })
      .catch(() => { csrfPromise = null })
  }
  return csrfPromise
}

api.interceptors.request.use(async (config) => {
  if (config.method && MUTATING_METHODS.has(config.method.toLowerCase())) {
    await ensureCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login/')) {
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
              csrfToken = null // force re-fetch after token rotation
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

export function getCsrfToken(): string | null { return csrfToken }
export { ensureCsrfToken }

export default api
