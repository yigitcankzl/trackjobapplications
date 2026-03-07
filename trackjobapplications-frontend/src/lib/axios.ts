import axios from 'axios'
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../services/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

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
            refreshPromise = axios
              .post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
                { refresh },
              )
              .then(({ data }) => {
                saveTokens({ access: data.access, refresh: data.refresh ?? refresh })
                return data.access as string
              })
              .finally(() => { refreshPromise = null })
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
