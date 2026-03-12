interface Props {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-lg p-6 border border-stone-200/60 dark:border-stone-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left">
      <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-1.5">{title}</h3>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>
    </div>
  )
}
