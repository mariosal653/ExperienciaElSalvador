'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'
import { LogoMark } from '@/components/brand/logo-mark'
import { HEADER_HIDDEN_ON_MOBILE, hasMobileNav } from '@/lib/mobile-nav'

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

  // En las páginas con barra inferior, en el celular la cabecera se
  // esconde al bajar y vuelve arriba del todo (ver lib/mobile-nav.ts).
  const withNav = hasMobileNav(usePathname())
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (!withNav) return
    const read = () => setScrolled(window.scrollY > 72)
    read()
    window.addEventListener('scroll', read, { passive: true })
    return () => window.removeEventListener('scroll', read)
  }, [withNav])

  return (
    // Capa 40 — ver la escala documentada en app/globals.css
    <header
      className={`no-print sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white transition duration-300 sm:px-4 ${
        withNav && scrolled ? HEADER_HIDDEN_ON_MOBILE : ''
      }`}
    >
      <div className="liquid-glass-tinted mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-2.5 pr-2.5 sm:pl-3 sm:pr-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={es ? 'Experiences in El Salvador · Inicio' : 'Experiences in El Salvador · Home'}>
          <LogoMark tone="onDark" className="h-7 w-auto shrink-0" />
          <span className="min-w-0 text-sm font-bold leading-tight tracking-tight sm:truncate sm:text-base">
            <span className="block sm:inline">Experiences in</span> <span className="block text-gold sm:inline">El Salvador</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitch lang={lang} onChange={setLang} />
          {!compact && (
            <>
              <div className="md:hidden">
                <SessionNav compact />
              </div>
              <div className="hidden md:block">
                <SessionNav />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
