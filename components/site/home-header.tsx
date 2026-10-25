'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, Compass, Menu, Search, X } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'
import type { Locale } from '@/lib/data'

type Section = { id: string; label: Record<Locale, string> }

/**
 * Enlaces de la cabecera, en el orden en que se muestran.
 *
 * OJO: este orden NO es el de la página. «Destinos» se enseña en tercer
 * lugar porque es de lo más buscado, pero su sección está al final. Para
 * saber qué sección se está leyendo hace falta el orden real: DOCUMENT_ORDER.
 */
const SECTIONS: Section[] = [
  { id: 'servicios', label: { ES: 'Servicios', EN: 'Services' } },
  { id: 'experiencias', label: { ES: 'Explorar', EN: 'Explore' } },
  { id: 'destinos', label: { ES: 'Destinos', EN: 'Destinations' } },
  { id: 'opiniones', label: { ES: 'Opiniones', EN: 'Reviews' } },
  { id: 'como-funciona', label: { ES: 'Cómo funciona', EN: 'How it works' } },
]

/** Las mismas secciones, en el orden en que aparecen al bajar la página. */
const DOCUMENT_ORDER = ['servicios', 'experiencias', 'opiniones', 'como-funciona', 'destinos']

/**
 * Cabecera de la portada. Una sola barra, dos estados.
 *
 * Sobre el héroe va transparente, como siempre: la foto del Izalco se ve
 * entera y el texto blanco se apoya en el degradado. Al pasar el héroe se
 * queda fija con el verde de marca —el mismo de las páginas interiores, así
 * que el idioma y la cuenta, que están hechos para fondo oscuro, siguen
 * sirviendo tal cual—, resalta la sección que se está leyendo y saca el
 * botón que devuelve al buscador.
 *
 * Hubo un intento anterior con DOS barras: esta encima del héroe y otra
 * pegajosa debajo. Se descartó porque repetía los mismos enlaces a media
 * pantalla de distancia y no se entendía cuál mandaba.
 *
 * Es `fixed`, no `sticky`: `sticky` ocuparía sitio en el flujo y empujaría
 * el héroe hacia abajo, con lo que la cabecera dejaría de montarse sobre la
 * foto. `<main>` no tiene transform ni filter, así que `fixed` se ancla a la
 * ventana sin sorpresas. El hueco lo reserva el `pt-24` del héroe.
 */
export function HomeHeader() {
  const { lang, setLang } = useLanguage()
  const es = lang === 'ES'
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  /**
   * ¿Se pasó ya el héroe? Se observa el propio héroe en vez de añadir un
   * centinela: con el margen superior recortado a la altura de la barra,
   * deja de cruzarse justo cuando su borde inferior pasa por debajo de
   * ella. Sin escuchar el scroll, que dispararía en cada píxel.
   */
  useEffect(() => {
    const hero = document.getElementById('inicio')
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  /**
   * Marca la sección que se está leyendo. El margen recorta la pantalla a
   * una franja alta —de debajo de la barra hasta el 45 %— y se considera
   * activa la sección que la ocupa.
   *
   * El observador solo avisa de los CAMBIOS, así que no basta con mirar las
   * entradas de cada aviso: hay que llevar la cuenta de cuáles siguen dentro
   * de la franja. Si no, al salir una sección sin que entre otra en el mismo
   * aviso, la barra se queda señalando la anterior.
   */
  useEffect(() => {
    const targets = DOCUMENT_ORDER.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    )
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
        const current = [...DOCUMENT_ORDER].reverse().find((id) => inside.has(id))
        setActive(current ?? null)
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  /** El enlace de la sección activa solo se marca con la barra ya sólida. */
  function linkClass(id: string): string {
    const isActive = scrolled && active === id
    return `rounded-full px-3 py-1.5 transition ${
      isActive ? 'bg-white/15 font-semibold text-gold' : 'hover:text-gold'
    }`
  }

  return (
    // Capa 40 — ver la escala documentada en app/globals.css
    <header
      className={`no-print fixed inset-x-0 top-0 z-40 text-white transition-colors duration-300 ${
        scrolled ? 'border-b border-brand-dark bg-brand/95 backdrop-blur-md' : 'border-b border-white/20'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <a href="#inicio" className="flex shrink-0 items-center gap-2.5" aria-label="Experiences El Salvador · Inicio">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-brand"><Compass size={21} strokeWidth={2.5} /></span>
          <span className="whitespace-nowrap text-lg font-bold tracking-tight">Experiences <span className="text-gold">El Salvador</span></span>
        </a>

        {/*
          El menú abierto empieza en lg, no en md: con cinco enlaces, en una
          tableta de 768 px la fila se salía de la pantalla y aparecía scroll
          horizontal. Hasta lg manda el botón de menú, que lleva lo mismo.
        */}
        <nav className="hidden items-center gap-1 whitespace-nowrap text-sm font-medium lg:flex" aria-label={es ? 'Navegación principal' : 'Main navigation'}>
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={scrolled && active === section.id ? 'true' : undefined}
              // «Cómo funciona» es el menos buscado y además se alcanza
              // bajando: en la franja de 1024 a 1280 px cede su sitio al
              // idioma, la cuenta y el botón de buscar. El menú lo lleva.
              className={`${linkClass(section.id)} ${section.id === 'como-funciona' ? 'hidden xl:inline-block' : ''}`}
            >
              {section.label[lang]}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {/*
            El botón solo existe con la barra sólida: sobre el héroe el
            buscador está ahí mismo, a un palmo. Hasta xl va sin texto —con
            texto, el idioma y la cuenta se salían a 1024 px.
          */}
          {scrolled && (
            <a
              href="#inicio"
              aria-label={es ? 'Volver al buscador' : 'Back to search'}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-sm font-bold text-white transition hover:bg-accent-dark xl:px-4"
            >
              <Search size={15} aria-hidden="true" />
              <span className="hidden xl:inline">{es ? 'Buscar' : 'Search'}</span>
              <ArrowUp size={14} aria-hidden="true" />
            </a>
          )}
          <LanguageSwitch lang={lang} onChange={setLang} />
          <SessionNav />
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {scrolled && (
            <a
              href="#inicio"
              aria-label={es ? 'Volver al buscador' : 'Back to search'}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-bold text-white transition hover:bg-accent-dark"
            >
              <Search size={14} aria-hidden="true" />
              <ArrowUp size={13} aria-hidden="true" />
            </a>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? (es ? 'Cerrar menú' : 'Close menu') : (es ? 'Abrir menú' : 'Open menu')}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/20 bg-brand px-5 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-4 text-sm">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`} onClick={() => setMenuOpen(false)}>
                {section.label[lang]}
              </a>
            ))}
          </nav>
          {/*
            Idioma y sesión también en móvil: antes el acceso a la cuenta
            solo existía en escritorio.
          */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-4">
            <LanguageSwitch lang={lang} onChange={setLang} />
            <SessionNav />
          </div>
        </div>
      )}
    </header>
  )
}
