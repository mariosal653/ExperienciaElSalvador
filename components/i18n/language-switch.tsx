'use client'

import type { Locale } from '@/lib/data'

/**
 * Selector de idioma. Un conmutador con las dos opciones a la vista es más
 * claro que un botón que solo muestra el idioma actual: se ve de un vistazo
 * qué idiomas hay y cuál está activo.
 */
export function LanguageSwitch({ lang, onChange }: { lang: Locale; onChange: (lang: Locale) => void }) {
  return (
    <div
      role="group"
      aria-label={lang === 'ES' ? 'Idioma' : 'Language'}
      className="flex items-center rounded-full border border-white/40 bg-white/10 p-0.5 backdrop-blur-sm"
    >
      {(['EN', 'ES'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={lang === option}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
            lang === option ? 'bg-white text-[#173f45]' : 'text-white/80 hover:text-white'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
