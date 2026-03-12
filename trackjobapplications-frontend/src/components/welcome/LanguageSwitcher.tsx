import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
]

export default function LanguageSwitcher({ compact = false, dropdownBelow = false }: { compact?: boolean; dropdownBelow?: boolean }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === i18n.language?.slice(0, 2)) ?? LANGUAGES[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-150 ${compact ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2'}`}
        aria-label={t('dashboard.aria.changeLanguage')}
      >
        <svg className="w-4 h-4 text-stone-500 dark:text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {!compact && <span>{current.flag}</span>}
        {!compact && <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{current.code.toUpperCase()}</span>}
        {!compact && <svg
          className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>}
      </button>

      {open && (
        <div role="menu" className={`absolute w-40 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-100 dark:border-stone-700 py-1 z-50 ${compact && !dropdownBelow ? 'left-full bottom-0 ml-2' : 'right-0 mt-1.5'}`}>
          {LANGUAGES.map(({ code, label, flag }) => {
            const isActive = current.code === code
            return (
              <button
                key={code}
                role="menuitem"
                onClick={() => { i18n.changeLanguage(code); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${isActive
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 font-semibold'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
              >
                <span className="text-base">{flag}</span>
                <span>{label}</span>
                {isActive && (
                  <svg className="w-3.5 h-3.5 ml-auto text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
