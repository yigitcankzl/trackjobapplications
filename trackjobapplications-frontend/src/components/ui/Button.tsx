import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'text-white bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 shadow-sm hover:shadow-md',
  secondary: 'text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 shadow-sm',
  danger: 'text-white bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md',
}

export default function Button({ variant = 'primary', className = '', children, disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${VARIANT_CLASSES[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
