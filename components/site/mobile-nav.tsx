'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CarFront, Compass, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-widget'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { hasMobileNav } from '@/lib/mobile-nav'

type Item = 'experiencias' | 'destinos' | 'driver'

/**
 * Barra de navegación flotante, abajo y al centro, SOLO EN EL CELULAR
 * (menos de 768 px). En tablet y en ventanas angostas los enlaces están
 * arriba, en la cabecera.
 *
 * Abajo porque ahí llega el pulgar; arriba, el menú obligaba a estirar la
 * mano o a abrir el botón de tres rayas. En escritorio no existe: nadie
 * busca el menú abajo en una computadora.
 *
 * - Cuatro destinos, con icono y texto: Explorar, Destinos, Driver y
 *   WhatsApp. WhatsApp va dentro de la barra, así que el botón flotante de
 *   WhatsApp se esconde en el celular en estas páginas (no se enciman).
 * - Siempre visible. Es la cabecera la que se esconde en el celular al
 *   bajar (ver headerHiddenClass en lib/mobile-nav.ts): así nunca hay dos
 *   menús a la vez en pantalla.
 * - Respeta el margen seguro inferior (la barra de Safari en iPhone y la
 *   barra de gestos de Android).
 * - Solo en las páginas de descubrir: ver lib/mobile-nav.ts.
 */
export function MobileNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const { lead } = useWhatsAppLead()
  const es = lang === 'ES'
  const home = pathname === '/'

  // En el inicio se resalta la sección que se está leyendo.
  const [section, setSection] = useState<Item | null>(null)
  useEffect(() => {
    if (!home) return
    const ids: Item[] = ['destinos', 'experiencias']
    function onScroll() {
      const middle = window.innerHeight / 2
      const current = ids.find((id) => {
        const box = document.getElementById(id)?.getBoundingClientRect()
        return box !== undefined && box.top <= middle && box.bottom >= middle
      })
      setSection(current ?? null)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [home])

  if (!hasMobileNav(pathname)) return null

  const active: Item | null = pathname?.startsWith('/servicios/personal-driver')
    ? 'driver'
    : pathname?.startsWith('/destinos/')
      ? 'destinos'
      : home
        ? section
        : null

  const items: { id: Item; href: string; label: string; icon: typeof Compass }[] = [
    { id: 'experiencias', href: home ? '#experiencias' : '/#experiencias', label: es ? 'Explorar' : 'Explore', icon: Compass },
    { id: 'destinos', href: home ? '#destinos' : '/#destinos', label: es ? 'Destinos' : 'Destinations', icon: MapPin },
    { id: 'driver', href: '/servicios/personal-driver', label: 'Driver', icon: CarFront },
  ]

  const itemClass = 'flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 text-[11px] font-semibold transition'

  return (
    <>
      {/* Hueco al final de la página para que la barra no tape el pie. */}
      <div aria-hidden="true" className="h-[calc(5.5rem+env(safe-area-inset-bottom,0px))] bg-cream md:hidden" />

      {/* Capa 50, como el widget de WhatsApp: ver la escala en app/globals.css. */}
      <nav
        aria-label={es ? 'Navegación' : 'Navigation'}
        className="no-print liquid-glass-tinted fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto flex w-fit items-center gap-0.5 rounded-full p-1.5 text-white md:hidden"
      >
        {items.map(({ id, href, label, icon: Icon }) => {
          const current = active === id
          return (
            <a
              key={id}
              href={href}
              aria-current={current ? 'page' : undefined}
              className={`${itemClass} ${current ? 'bg-white text-brand' : 'text-white/85 hover:bg-white/10'}`}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
            </a>
          )
        })}
        <a
          href={buildWhatsAppUrl({ ...lead, lang })}
          target="_blank"
          rel="noopener noreferrer"
          className={`${itemClass} bg-[#25D366] text-[#0b3d22] hover:bg-[#20bd5a]`}
        >
          <WhatsAppGlyph className="h-[19px] w-[19px]" />
          WhatsApp
        </a>
      </nav>
    </>
  )
}
