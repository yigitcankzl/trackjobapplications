interface Props {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-100 dark:hover:border-blue-800 transition-all duration-200 text-left">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}
