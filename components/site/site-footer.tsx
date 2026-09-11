'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/i18n/language-provider'

/** Pie común. Enlaza las páginas legales y los créditos de las fotos. */
export function SiteFooter() {
  const { lang } = useLanguage()
  const es = lang === 'ES'

  const links = [
    { href: '/legal/terms', label: es ? 'Términos' : 'Terms' },
    { href: '/legal/cancellation', label: es ? 'Cancelación' : 'Cancellation' },
    { href: '/legal/privacy', label: es ? 'Privacidad' : 'Privacy' },
    { href: '/credits', label: es ? 'Créditos de fotos' : 'Photo credits' },
  ]

  return (
    <footer className="no-print border-t border-[#dce7e1] px-5 py-8 text-sm text-[#6a8588]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
        <span className="font-bold text-[#173f45]">
          Experience <span className="text-[#b8481c]">El Salvador</span>
        </span>
        <span>{es ? 'Hecho con cariño desde El Salvador · © 2026' : 'Made with care in El Salvador · © 2026'}</span>
        <nav aria-label={es ? 'Enlaces legales' : 'Legal links'} className="flex flex-wrap gap-x-4 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#173f45] hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
