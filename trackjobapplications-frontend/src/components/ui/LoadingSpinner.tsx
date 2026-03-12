interface LoadingSpinnerProps {
  size?: 'sm' | 'md'
  centered?: boolean
}

export default function LoadingSpinner({ size = 'md', centered = false }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  const spinner = <div className={`${sizeClass} border-2 border-teal-600 border-t-transparent rounded-full animate-spin`} />

  if (centered) {
    return <div className="flex justify-center py-4">{spinner}</div>
  }
  return spinner
}
