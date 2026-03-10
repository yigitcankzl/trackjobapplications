import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  withCredentials: true, // Send httpOnly JWT cookies automatically
})

let refreshPromise: Promise<void> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

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
              `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
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
