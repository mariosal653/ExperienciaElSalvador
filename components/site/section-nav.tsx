'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import type { Locale } from '@/lib/data'

type Section = { id: string; label: Record<Locale, string> }

/**
 * Secciones de la portada, en el mismo orden en que aparecen al bajar.
 * Son las mismas del menú de la cabecera: quien baja no tiene por qué
 * perder la referencia de dónde está ni cómo llegar al resto.
 */
const SECTIONS: Section[] = [
  { id: 'servicios', label: { ES: 'Servicios', EN: 'Services' } },
  { id: 'reels', label: { ES: 'Videos', EN: 'Videos' } },
  { id: 'experiencias', label: { ES: 'Explorar', EN: 'Explore' } },
  { id: 'opiniones', label: { ES: 'Opiniones', EN: 'Reviews' } },
  { id: 'como-funciona', label: { ES: 'Cómo funciona', EN: 'How it works' } },
  { id: 'destinos', label: { ES: 'Destinos', EN: 'Destinations' } },
]

/**
 * Barra de secciones que se queda pegada arriba al pasar el héroe.
 *
 * Va DESPUÉS del héroe en el DOM, no dentro: así `sticky` basta para que
 * aparezca justo cuando la cabecera del héroe —que es `absolute`— ya se
 * fue con el scroll. Sin listeners de scroll ni cálculos de altura.
 *
 * El botón de la derecha devuelve al buscador. Es lo que más se echa de
 * menos en una portada larga: bajas, ves algo, y quieres cambiar el
 * destino o la fecha sin tener que subir a pulso.
 */
export function SectionNav() {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const [active, setActive] = useState<string | null>(null)

  /**
   * Marca la sección que se está leyendo. El margen recorta la pantalla a
   * una franja alta —de debajo de la barra hasta el 45 %— y se considera
   * activa la sección que la ocupa.
   *
   * El observador solo avisa de los CAMBIOS, así que no basta con mirar
   * las entradas de cada aviso: hay que llevar la cuenta de cuáles siguen
   * dentro de la franja. Si no, al salir una sección sin que entre otra en
   * el mismo aviso, la barra se queda señalando la anterior.
   */
  useEffect(() => {
    const ids = SECTIONS.map((section) => section.id)
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)
    if (targets.length === 0) return

    const inside = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inside.add(entry.target.id)
          else inside.delete(entry.target.id)
        }
        // La última en orden de página: es la que domina la franja al bajar
        // y la que se deja de ver primero al subir.
        const current = [...ids].reverse().find((id) => inside.has(id))
        setActive(current ?? null)
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  return (
    // Capa 40, la misma que la cabecera del héroe: nunca coinciden en
    // pantalla, porque esta empieza donde aquella ya salió.
    <nav
      aria-label={es ? 'Secciones de la página' : 'Page sections'}
      className="no-print sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 lg:px-8">
        <ul className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 py-2.5 [scrollbar-width:none]">
          {SECTIONS.map((section) => {
            const isActive = active === section.id
            return (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`block rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-surface-mint text-brand' : 'text-muted hover:bg-surface-mint hover:text-brand'
                  }`}
                >
                  {section.label[lang]}
                </a>
              </li>
            )
          })}
        </ul>

        <a
          href="#inicio"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark sm:text-sm"
        >
          <span className="hidden sm:inline">{es ? 'Buscar experiencias' : 'Search experiences'}</span>
          <span className="sm:hidden">{es ? 'Buscar' : 'Search'}</span>
          <ArrowUp size={15} aria-hidden="true" />
        </a>
      </div>
    </nav>
  )
}
