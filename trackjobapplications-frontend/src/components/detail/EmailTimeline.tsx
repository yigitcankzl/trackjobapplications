import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmailLog } from '../../types'
import { getEmailLogs, deleteEmailLog } from '../../services/applications'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import { TrashIcon } from '../icons'

interface Props {
  applicationId: number
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  rejection: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  interview_invite: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  offer: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  follow_up: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
  general: { bg: 'bg-stone-50 dark:bg-stone-800', text: 'text-stone-700 dark:text-stone-400' },
}

export default function EmailTimeline({ applicationId }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    getEmailLogs(applicationId)
      .then(data => { if (mountedRef.current) setEmails(data) })
      .catch(() => { if (mountedRef.current) addToast(t('detail.emails.loadFailed'), 'error') })
      .finally(() => { if (mountedRef.current) setLoading(false) })
    return () => { mountedRef.current = false }
  }, [applicationId, addToast, t])

  async function handleDelete(emailId: number) {
    try {
      await deleteEmailLog(applicationId, emailId)
      setEmails(prev => prev.filter(e => e.id !== emailId))
    } catch {
      addToast(t('detail.emails.deleteFailed'), 'error')
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
        {t('detail.emails.title')}
        {emails.length > 0 && <span className="ml-1.5 text-xs text-stone-400">({emails.length})</span>}
      </h3>

      {loading ? (
        <LoadingSpinner size="sm" centered />
      ) : emails.length === 0 ? (
        <p className="text-xs text-stone-400 dark:text-stone-500 italic">{t('detail.emails.empty')}</p>
      ) : (
        <div className="space-y-2">
          {emails.map(email => {
            const style = TYPE_STYLES[email.email_type] || TYPE_STYLES.general
            return (
              <div key={email.id} className={`rounded-lg p-3 ${style.bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase ${style.text}`}>
                        {t(`detail.emails.types.${email.email_type}`)}
                      </span>
                      {email.suggested_status && (
                        <span className="text-xs text-stone-400">
                          → {email.suggested_status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                      {email.subject}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {email.sender_name ? `${email.sender_name} <${email.sender_email}>` : email.sender_email}
                    </p>
                    {email.snippet && (
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 line-clamp-2">
                        {email.snippet}
                      </p>
                    )}
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(email.received_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(email.id)}
                    className="text-stone-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                    title={t('detail.emails.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
