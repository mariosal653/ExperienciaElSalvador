'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { useLanguage } from '@/components/i18n/language-provider'
import { reels } from '@/lib/reels'
import { ReelViewer } from './reel-viewer'

/**
 * Tira de reels verticales de la portada.
 *
 * Es un CARRUSEL en todos los tamaños, no una cuadrícula. Antes eran siete
 * columnas fijas en escritorio: con el ancho de la página tocaban a 160 px
 * cada una, los títulos se partían en dos líneas y la fila parecía una
 * tira de miniaturas. En carrusel las tarjetas mantienen su tamaño, da
 * igual cuántos reels haya, y añadir uno nuevo no estrecha a los demás.
 *
 * Rendimiento: las miniaturas llevan loading="lazy" y ningún vídeo se
 * descarga hasta que el visitante abre un reel. La sección no compite con
 * la imagen del héroe por el LCP.
 */
export function ReelsSection() {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const [active, setActive] = useState<number | null>(null)

  const track = useRef<HTMLUListElement>(null)
  /** Dónde está el carrusel: sirve para apagar la flecha que no lleva a nada. */
  const [edge, setEdge] = useState({ start: true, end: true })

  const sync = useCallback(() => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    // Margen de 4 px: el scroll suave no siempre cae en el número exacto.
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 })
  }, [])

  // Al montar y cada vez que cambia el ancho: con la ventana ancha puede
  // que quepan todos y entonces no hay flechas que mostrar.
  useEffect(() => {
    const el = track.current
    if (!el) return
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [sync])

  const page = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const scrollable = !(edge.start && edge.end)
  const arrow = 'grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-brand transition hover:bg-surface-mint disabled:cursor-default disabled:opacity-35 disabled:hover:bg-surface'

  return (
    <section id="reels" aria-labelledby="reels-title" className="mx-auto max-w-7xl px-5 pt-14 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-accent">
            {es ? 'En imágenes' : 'In pictures'}
          </p>
          <h2 id="reels-title" className="text-3xl font-semibold tracking-tight md:text-4xl">
            {es ? (
              <>
                Descubre <em className="font-serif font-normal">El Salvador</em>
              </>
            ) : (
              <>
                Discover <em className="font-serif font-normal">El Salvador</em>
              </>
            )}
          </h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted">
            {es
              ? 'Los lugares a los que te llevamos, a pantalla completa. Toca cualquiera para verlo.'
              : 'The places we take you to, full screen. Tap any of them to watch.'}
          </p>
        </div>

        {/*
          Flechas solo donde hay ratón y solo si el carrusel se puede mover:
          en móvil se arrastra con el dedo y una flecha ahí sobra.
        */}
        {scrollable && (
          <div className="hidden shrink-0 gap-2 lg:flex">
            <button type="button" onClick={() => page(-1)} disabled={edge.start} className={arrow} aria-label={es ? 'Ver reels anteriores' : 'See previous reels'}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => page(1)} disabled={edge.end} className={arrow} aria-label={es ? 'Ver más reels' : 'See more reels'}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/*
        El margen negativo deja que el carrusel llegue al borde de la
        pantalla en móvil sin romper el ancho de la página. pb-3/pt-1 dejan
        sitio al salto de la tarjeta al pasar el ratón, que si no se
        recortaba.

        scroll-pl-5: sin él, el ajuste por pasos (snap) alinea la primera
        tarjeta con el borde del contenedor y se come el margen lateral, así
        que en móvil la tarjeta quedaba pegada al filo de la pantalla
        mientras el titular sí respetaba el margen.
      */}
      <ul
        ref={track}
        onScroll={sync}
        className="-mx-5 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] lg:mx-0 lg:scroll-pl-0 lg:px-0"
      >
        {reels.map((reel, index) => {
          const isVideo = Boolean(reel.videoUrl)
          return (
            <li key={reel.id} className="w-[44vw] max-w-[190px] shrink-0 snap-start sm:w-[190px] lg:w-[212px] lg:max-w-none">
              <button
                type="button"
                onClick={() => setActive(index)}
                className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-brand text-left shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={`${es ? 'Ver reel' : 'Watch reel'}: ${reel.title[lang]}, ${reel.location}`}
              >
                <Picture
                  src={reel.thumbnail}
                  sizes="(min-width: 1024px) 212px, (min-width: 640px) 190px, 44vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={320}
                  height={568}
                  style={reel.focus ? { objectPosition: reel.focus } : undefined}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {/*
                  Degradado más alto y más oscuro abajo: con el anterior, un
                  título de dos líneas sobre cielo claro se perdía.
                */}
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,43,48,0)_35%,rgba(10,43,48,.9)_100%)]" />

                {/*
                  El triángulo de reproducción aparece SOLO en los reels que
                  llevan vídeo. Antes era al revés: las fotos anunciaban un
                  vídeo que no existía y el único vídeo real quedaba marcado
                  con una claqueta que no decía nada. Las fotos no llevan
                  distintivo: siete chapas iguales eran ruido, y el salto de
                  la tarjeta al pasar el ratón ya dice que se puede pulsar.
                */}
                {isVideo && (
                  <>
                    <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-accent text-white shadow-sm">
                      <Play size={15} fill="currentColor" aria-hidden="true" />
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      {es ? 'Vídeo' : 'Video'}
                    </span>
                  </>
                )}

                <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <span className="block text-[15px] font-semibold leading-snug">{reel.title[lang]}</span>
                  <span className="mt-1 block text-xs text-white/75">{reel.location}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {active !== null && (
        <ReelViewer index={active} onIndexChange={setActive} onClose={() => setActive(null)} />
      )}
    </section>
  )
}
