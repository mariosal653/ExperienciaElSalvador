'use client'

import Link from 'next/link'
import { Compass } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'

/**
 * Cabecera de las páginas interiores (detalle, checkout, reserva, entradas,
 * legales). Misma marca y paleta que la portada, sobre fondo sólido porque
 * aquí no hay imagen de héroe debajo.
 */
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage()
  const es = lang === 'ES'

  return (
    <header className="no-print border-b border-[#0e3035] bg-[#173f45] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={es ? 'Experience El Salvador · Inicio' : 'Experience El Salvador · Home'}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4b942] text-[#173f45]">
            <Compass size={18} strokeWidth={2.5} />
          </span>
          <span className="truncate text-base font-bold tracking-tight">
            Experience <span className="text-[#f4b942]">El Salvador</span>
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
