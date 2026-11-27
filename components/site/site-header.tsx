'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'
import { LogoMark } from '@/components/brand/logo-mark'

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
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={es ? 'Experiences in El Salvador · Inicio' : 'Experiences in El Salvador · Home'}>
          <LogoMark tone="onDark" className="h-7 w-auto shrink-0" />
          <span className="truncate text-base font-bold tracking-tight">
            Experiences in <span className="text-gold">El Salvador</span>
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
