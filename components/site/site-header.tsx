'use client'

import Link from 'next/link'
import { Compass } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'

/**
 * Cabecera de las páginas interiores (detalle, checkout, reserva, entradas,
 * legales). La misma píldora de vidrio que la portada, ya teñida con el
 * verde de marca (.liquid-glass-tinted): aquí no hay foto de héroe debajo,
 * solo fondo claro, y el texto blanco necesita apoyo.
 *
 * Es `sticky`, no `fixed` como la de la portada: ocupa su sitio en el flujo
 * y no hay que reservarle hueco en cada página. Los paneles laterales
 * pegajosos (checkout, servicios) usan lg:top-24 para quedar por debajo.
 */
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage()
  const es = lang === 'ES'

  return (
    // Capa 40 — ver la escala documentada en app/globals.css
    <header className="no-print sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-4">
      <div className="liquid-glass-tinted mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-2.5 pr-2.5 sm:pl-3 sm:pr-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={es ? 'Experiences El Salvador · Inicio' : 'Experiences El Salvador · Home'}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-brand">
            <Compass size={18} strokeWidth={2.5} />
          </span>
          <span className="truncate text-base font-bold tracking-tight">
            Experiences <span className="text-gold">El Salvador</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitch lang={lang} onChange={setLang} />
          {!compact && (
            <div className="hidden md:block">
              <SessionNav />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
