interface Props {
  title: string
  action?: React.ReactNode
}

export default function Header({ title, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">{title}</h1>
      {action}
    </div>
  )
}
