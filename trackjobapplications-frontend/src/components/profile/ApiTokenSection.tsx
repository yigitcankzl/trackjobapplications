import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../context/ToastContext'
import { ApiTokenStatus, createApiToken, fetchApiToken, revokeApiToken } from '../../services/auth'

const MCP_URL = 'https://trackjobs-mcp.onrender.com/mcp'

export default function ApiTokenSection() {
  const { t, i18n } = useTranslation()
  const { addToast } = useToast()
  const [status, setStatus] = useState<ApiTokenStatus | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchApiToken().then(setStatus).catch(() => setStatus({ exists: false }))
  }, [])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(i18n.language)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
      setStatus(await fetchApiToken())
    } catch {
      addToast(t('profile.apiToken.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  function handleCreate() {
    if (status?.exists && !window.confirm(t('profile.apiToken.confirmRegenerate'))) return
    run(async () => {
      setNewToken(await createApiToken())
      setCopied(false)
    })
  }

  function handleRevoke() {
    if (!window.confirm(t('profile.apiToken.confirmRevoke'))) return
    run(async () => {
      await revokeApiToken()
      setNewToken(null)
    })
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  const setupCommand = `claude mcp add --transport http trackjobs ${MCP_URL} --header "Authorization: Bearer ${newToken}"`

  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{t('profile.apiToken.title')}</h2>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{t('profile.apiToken.description')}</p>
      </div>

      {newToken && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{t('profile.apiToken.copyOnce')}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={newToken}
              onFocus={(e) => e.target.select()}
              aria-label={t('profile.apiToken.title')}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => handleCopy(newToken)}
              className="px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {copied ? t('profile.apiToken.copied') : t('profile.apiToken.copy')}
            </button>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">{t('profile.apiToken.setup')}</p>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all p-3 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300">{setupCommand}</pre>
          </div>
        </div>
      )}

      {status && !newToken && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {status.exists && status.created_at
            ? `${t('profile.apiToken.active', { created: formatDate(status.created_at) })} · ${
                status.last_used_at
                  ? t('profile.apiToken.lastUsed', { date: formatDate(status.last_used_at) })
                  : t('profile.apiToken.neverUsed')
              }`
            : t('profile.apiToken.none')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy || !status}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
        >
          {status?.exists ? t('profile.apiToken.regenerate') : t('profile.apiToken.create')}
        </button>
        {status?.exists && (
          <button
            type="button"
            onClick={handleRevoke}
            disabled={busy}
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
          >
            {t('profile.apiToken.revoke')}
          </button>
        )}
      </div>
    </div>
  )
}
