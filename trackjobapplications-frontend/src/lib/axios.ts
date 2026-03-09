import axios from 'axios'
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../services/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = getRefreshToken()
      if (refresh) {
        try {
          if (!refreshPromise) {
            if (refreshTimer) clearTimeout(refreshTimer)
            refreshPromise = axios
              .post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
                { refresh },
              )
              .then(({ data }) => {
                saveTokens({ access: data.access, refresh: data.refresh ?? refresh })
                // Keep promise alive briefly so concurrent 401s reuse the same result
                refreshTimer = setTimeout(() => { refreshPromise = null }, 500)
                return data.access as string
              })
              .catch((err) => {
                refreshPromise = null
                throw err
              })
          }
          const newAccess = await refreshPromise
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        } catch {
          clearTokens()
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
