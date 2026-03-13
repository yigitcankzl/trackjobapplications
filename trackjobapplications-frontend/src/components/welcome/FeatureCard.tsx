interface Props {
  icon: React.ReactNode
  title: string
  description: string
  color?: string
  badge?: string
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  stone: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
}

export default function FeatureCard({ icon, title, description, color = 'stone', badge }: Props) {
  return (
    <div className="group bg-white dark:bg-stone-900 rounded-lg p-6 border border-stone-200/60 dark:border-stone-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${COLOR_MAP[color] || COLOR_MAP.stone}`}>
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
        {badge && (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>
    </div>
  )
}
