'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, Search } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { SessionNav } from '@/components/auth/session-nav'
import type { Locale } from '@/lib/data'
import { LogoMark } from '@/components/brand/logo-mark'
import { HEADER_HIDDEN_ON_MOBILE } from '@/lib/mobile-nav'

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
  { id: 'ideas', label: { ES: 'Ideas de viaje', EN: 'Trip ideas' } },
]

/** Las mismas secciones, en el orden en que aparecen al bajar la página. */
const DOCUMENT_ORDER = ['destinos', 'servicios', 'experiencias', 'ideas']

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
  const [scrolled, setScrolled] = useState(false)

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
    <header
      className={`no-print fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white transition duration-300 sm:px-4 ${
        scrolled ? HEADER_HIDDEN_ON_MOBILE : ''
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-full py-2.5 pl-2.5 pr-2.5 sm:gap-4 sm:pl-4 sm:pr-4 lg:pr-3 ${
          scrolled ? 'liquid-glass-tinted' : 'liquid-glass'
        }`}
      >
        <a href="#inicio" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label={`Experiences in El Salvador · ${es ? 'Inicio' : 'Home'}`}>
          <LogoMark tone="onDark" className="h-8 w-auto shrink-0" />
          {/* Hasta lg el nombre va en dos líneas: en el celular para que
              quepan el idioma y la cuenta, y en tablet para que quepan
              además los tres enlaces (en una línea, a 768 px la cápsula
              se desbordaba 34 px en inglés). */}
          <span className="text-sm font-bold leading-tight tracking-tight md:text-base lg:whitespace-nowrap lg:text-lg">
            <span className="block lg:inline">Experiences in</span> <span className="block text-gold lg:inline">El Salvador</span>
          </span>
        </a>

        {/*
          El menú abierto empieza en lg, no en md: con cinco enlaces, en una
          tableta de 768 px la fila se salía de la pantalla y aparecía scroll
          horizontal. Hasta lg manda el botón de menú, que lleva lo mismo.
        */}
        <nav className="hidden items-center gap-1 whitespace-nowrap text-sm font-medium md:flex" aria-label={es ? 'Navegación principal' : 'Main navigation'}>
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={scrolled && active === section.id ? 'true' : undefined}
              // Solo cuatro enlaces. «Opiniones» y «Cómo funciona» salieron
              // del menú: se alcanzan bajando, y con ellos más el botón de
              // buscar la cápsula se desbordaba en español a 1 920 px.
              // «Ideas de viaje» entra desde xl: a 1024 px no cabe junto a la cuenta.
              className={`${linkClass(section.id)} ${section.id === 'ideas' ? 'hidden xl:inline-block' : ''}`}
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
              // Solo desde xl: de 1024 a 1279 px, en español, el idioma y la
              // cuenta ya llenan la cápsula y este botón la desbordaba 16 px.
              // Ahí el logo hace el mismo trabajo: vuelve al buscador.
              className="hidden items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-dark xl:flex"
            >
              <Search size={15} aria-hidden="true" />
              {es ? 'Buscar' : 'Search'}
              <ArrowUp size={14} aria-hidden="true" />
            </a>
          )}
          <LanguageSwitch lang={lang} onChange={setLang} />
          <SessionNav />
        </div>

        {/*
          Hasta lg: idioma y cuenta en versión compacta, sin botón de menú.
          En el celular los enlaces viven en la barra flotante de abajo
          (components/site/mobile-nav.tsx) y esta cabecera se esconde al
          bajar; desde md (tablet) los enlaces vuelven aquí arriba.
        */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <LanguageSwitch lang={lang} onChange={setLang} />
          <SessionNav compact />
        </div>
      </div>

    </header>
  )
}
