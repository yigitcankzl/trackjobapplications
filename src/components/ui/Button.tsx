import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-md hover:shadow-blue-200',
  secondary: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
  danger: 'text-white bg-red-500 hover:bg-red-600',
}

export default function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
