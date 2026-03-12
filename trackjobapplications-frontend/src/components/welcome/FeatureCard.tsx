interface Props {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-lg p-6 border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-all duration-200 text-left">
      <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-1.5">{title}</h3>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>
    </div>
  )
}
