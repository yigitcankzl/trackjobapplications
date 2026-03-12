import { useTranslation } from 'react-i18next'

interface Props {
  applicationId: number
}

export default function AttachmentList({ applicationId: _ }: Props) {
  const { t } = useTranslation()

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-white/70 dark:bg-stone-900/70 backdrop-blur-[2px] rounded-lg z-10 flex flex-col items-center justify-center gap-1">
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('comingSoon')}</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">{t('comingSoonDesc')}</span>
      </div>
      <div className="space-y-3 pointer-events-none select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('detail.attachmentList.title')}</h3>
        </div>
        <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-4 text-center">
          <p className="text-xs text-stone-400">{t('detail.attachmentList.dropOrClick')}</p>
          <p className="text-xs text-stone-300 mt-0.5">{t('detail.attachmentList.formats')}</p>
        </div>
      </div>
    </div>
  )
}
