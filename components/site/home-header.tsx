'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'
import type { Locale } from '@/lib/data'
import { LogoMark } from '@/components/brand/logo-mark'

type Section = { id: string; label: Record<Locale, string> }

/**
 * Enlaces de la cabecera, en el orden en que se muestran.
 *
 * OJO: este orden NO es el de la página. «Destinos» se enseña en tercer
 * lugar, pero su sección es la primera, justo debajo del buscador. Para
 * saber qué sección se está leyendo hace falta el orden real: DOCUMENT_ORDER.
 */
const SECTIONS: Section[] = [
  { id: 'servicios', label: { ES: 'Personal Driver', EN: 'Personal Driver' } },
  { id: 'experiencias', label: { ES: 'Explorar', EN: 'Explore' } },
  { id: 'destinos', label: { ES: 'Destinos', EN: 'Destinations' } },
  { id: 'opiniones', label: { ES: 'Opiniones', EN: 'Reviews' } },
  { id: 'como-funciona', label: { ES: 'Cómo funciona', EN: 'How it works' } },
]

/** Las mismas secciones, en el orden en que aparecen al bajar la página. */
const DOCUMENT_ORDER = ['destinos', 'servicios', 'experiencias', 'opiniones', 'como-funciona']

/**
 * Cabecera de la portada. Una sola barra, dos estados.
 *
 * Es una píldora de vidrio (.liquid-glass, en app/globals.css) que flota
 * separada de los bordes. Sobre el héroe el vidrio es casi incoloro y deja
 * ver la foto del Izalco. Al pasar el héroe se tiñe con el verde de marca
 * —el mismo de las páginas interiores, así que el idioma y la cuenta, que
 * están hechos para fondo oscuro, siguen sirviendo tal cual—, resalta la
 * sección que se está leyendo y saca el botón que devuelve al buscador.
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

  // Escape cierra el menú móvil y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      document.getElementById('home-menu-button')?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])
  const [active, setActive] = useState<string | null>(null)

  /**
   * ¿Se empezó a bajar? Entonces la cápsula pasa del cristal claro
   * (`liquid-glass`) al tintado (`liquid-glass-tinted`), que sostiene el
   * texto blanco sobre cualquier fondo.
   *
   * Antes la condición era «¿se pasó ya el héroe?», con un observador
   * sobre el propio héroe. Era correcta para lo que preguntaba, pero el
   * héroe mide 620 px —más de 1 500 en móvil— y la barra es `fixed`: en
   * todo ese recorrido el titular y el subtítulo pasaban POR DEBAJO de una
   * barra sin fondo y se dibujaban encima del logotipo. Dos textos en los
   * mismos píxeles: ilegibles los dos. El velo del estado transparente
   * atenúa, pero no evita el choque; lo único que lo evita es que la barra
   * deje de ser transparente en cuanto el contenido empieza a pasar bajo
   * ella.
   *
   * El umbral es la altura de la barra: en reposo, con el héroe entero a
   * la vista, sigue transparente y la foto se ve completa, que es para lo
   * que está. Al primer gesto, tintada.
   *
   * Se escucha el scroll, no se observa un elemento: la pregunta ya no es
   * «¿dónde está el héroe?» sino «¿cuánto se ha bajado?», y el estado solo
   * cambia dos veces en toda la página. El trabajo por evento es leer
   * `scrollY` y comparar, que es justo lo que hace el navegador al
   * calcular un `rootMargin`.
   */
  useEffect(() => {
    const THRESHOLD = 72

    const read = () => setScrolled(window.scrollY > THRESHOLD)

    read()
    window.addEventListener('scroll', read, { passive: true })
    return () => window.removeEventListener('scroll', read)
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
    // El margen superior respeta la muesca del iPhone (safe-area).
    <header className="no-print fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-4">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-full py-2.5 pl-2.5 pr-2.5 sm:gap-4 sm:pl-4 sm:pr-4 lg:pr-3 ${
          scrolled ? 'liquid-glass-tinted' : 'liquid-glass'
        }`}
      >
        <a href="#inicio" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label={`Experiences in El Salvador · ${es ? 'Inicio' : 'Home'}`}>
          <LogoMark className="h-9 w-9 shrink-0 rounded-[28%] ring-1 ring-white/30" />
          <span className="whitespace-nowrap text-base font-bold sm:text-lg tracking-tight">Experiences in <span className="text-gold">El Salvador</span></span>
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
              // «Cómo funciona» y «Opiniones» son los menos buscados y se
              // alcanzan bajando: de 1024 a 1536 px ceden su
              // sitio al idioma, la cuenta y el botón de buscar. Con la
              // cápsula de cristal (que lleva su propio margen interior),
              // dejar «Opiniones» desbordaba la barra 56 px a 1024.
              className={`${linkClass(section.id)} ${section.id === 'como-funciona' || section.id === 'opiniones' ? 'hidden 2xl:inline-block' : ''}`}
            >
              {section.label[lang]}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {/*
            Sin botón de búsqueda en escritorio: competía en terracota con
            «Reservar». El buscador está arriba y el logo lleva al inicio.
            En móvil queda un icono discreto para volver al buscador.
          */}
          <LanguageSwitch lang={lang} onChange={setLang} />
          <SessionNav />
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {scrolled && (
            <a
              href="#inicio"
              aria-label={es ? 'Volver al buscador' : 'Back to search'}
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
            >
              <Search size={17} aria-hidden="true" />
            </a>
          )}
          <button
            id="home-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
            aria-expanded={menuOpen}
            aria-controls="home-mobile-menu"
            aria-label={menuOpen ? (es ? 'Cerrar menú' : 'Close menu') : (es ? 'Abrir menú' : 'Open menu')}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        // Panel aparte bajo la píldora, siempre teñido: el menú se abre
        // sobre cualquier sección y el texto blanco necesita fondo.
        <div id="home-mobile-menu" className="liquid-glass-tinted mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-7xl overflow-y-auto rounded-3xl px-5 pb-5 pt-4 lg:hidden">
          <nav className="flex flex-col gap-4 text-sm" aria-label={es ? 'Navegación principal' : 'Main navigation'}>
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
