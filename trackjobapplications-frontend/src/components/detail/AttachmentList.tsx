import { useTranslation } from 'react-i18next'

interface Props {
  applicationId: number
}

export default function AttachmentList({ applicationId: _ }: Props) {
  const { t } = useTranslation()

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center gap-1">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('comingSoon')}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{t('comingSoonDesc')}</span>
      </div>
      <div className="space-y-3 pointer-events-none select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('detail.attachmentList.title')}</h3>
        </div>
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">{t('detail.attachmentList.dropOrClick')}</p>
          <p className="text-xs text-gray-300 mt-0.5">{t('detail.attachmentList.formats')}</p>
        </div>
      </div>
    </div>
  )
}
