const _getApiBase = (): string => {
  const env = import.meta.env.VITE_API_URL
  if (env) return env
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL must be set in production builds')
  }
  return 'http://localhost:8000/api/v1'
}

export const API_BASE = _getApiBase()
