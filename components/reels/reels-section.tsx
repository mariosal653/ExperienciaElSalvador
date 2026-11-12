'use client'

import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Compass, Expand, MapPin, Play } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { useLanguage } from '@/components/i18n/language-provider'
import { reels } from '@/lib/reels'
import { ReelViewer } from './reel-viewer'

/**
 * Carrusel de cartas apiladas de la portada («Descubre El Salvador»).
 *
 * Una carta activa al centro, grande, y las vecinas asomando detrás, cada
 * vez más pequeñas y apagadas. La activa lleva un panel de vidrio con el
 * lugar y una franja oscura con el título en vertical; las demás solo
 * muestran la foto, para que la vista vaya siempre a la del centro.
 *
 * Se mueve con las flechas, con los puntos, con el teclado (← →) y
 * arrastrando con el dedo o el ratón. Es circular: después de la última
 * vuelve la primera. Tocar la carta activa abre el visor a pantalla
 * completa; tocar una vecina la trae al centro.
 *
 * Rendimiento: las miniaturas llevan loading="lazy" y ningún vídeo se
 * descarga hasta que el visitante abre un reel.
 */

/** Cuántas cartas se ven a cada lado de la activa. */
const VISIBLE_SIDE = 2
/** Desplazamiento mínimo, en px, para que un arrastre cuente como pase. */
const SWIPE_PX = 40

/** Posición relativa a la activa en un carrusel circular: -n/2 … n/2. */
function offsetOf(index: number, active: number, total: number): number {
  let offset = index - active
  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total
  return offset
}

function cardStyle(offset: number): CSSProperties {
  const depth = Math.abs(offset)
  const side = Math.sign(offset)
  // Cada carta se aparta menos que la anterior: así se apilan en vez de
  // quedar en fila.
  const shift = depth === 0 ? 0 : side * (46 + (depth - 1) * 30)
  const scale = 1 - depth * 0.13
  return {
    transform: `translateX(calc(-50% + ${shift}%)) scale(${scale}) rotateY(${-side * Math.min(depth, 2) * 4}deg)`,
    zIndex: 10 - depth,
    opacity: depth > VISIBLE_SIDE ? 0 : 1,
    filter: depth === 0 ? 'none' : `brightness(${1 - depth * 0.22}) saturate(${1 - depth * 0.15})`,
    pointerEvents: depth > VISIBLE_SIDE ? 'none' : 'auto',
  }
}

export function ReelsSection() {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const total = reels.length

  const [current, setCurrent] = useState(0)
  const [viewer, setViewer] = useState<number | null>(null)

  const go = useCallback((index: number) => setCurrent(((index % total) + total) % total), [total])
  const step = (direction: 1 | -1) => go(current + direction)

  /* Arrastre: se decide al soltar, comparando con dónde empezó. */
  const drag = useRef<{ x: number; moved: boolean } | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, moved: false }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current && Math.abs(event.clientX - drag.current.x) > 8) drag.current.moved = true
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1)
    // Se limpia en el siguiente ciclo para que el clic que sigue al
    // arrastre sepa que no fue un toque.
    setTimeout(() => (drag.current = null), 0)
  }

  const onCardClick = (index: number) => {
    if (drag.current?.moved) return
    if (index === current) setViewer(index)
    else go(index)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  const arrow =
    'grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-brand shadow-sm transition hover:bg-surface-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

  const activeReel = reels[current]

  return (
    <section id="reels" aria-labelledby="reels-title" className="overflow-hidden pt-14">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
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

      <div
        role="region"
        aria-roledescription={es ? 'carrusel' : 'carousel'}
        aria-label={es ? 'Lugares de El Salvador' : 'Places in El Salvador'}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        className="relative mx-auto mt-8 h-[440px] max-w-5xl touch-pan-y select-none outline-none [perspective:1400px] focus-visible:ring-2 focus-visible:ring-accent/40 md:h-[500px]"
      >
        <ul className="contents">
          {reels.map((reel, index) => {
            const offset = offsetOf(index, current, total)
            const isActive = offset === 0
            const isVideo = Boolean(reel.videoUrl)
            return (
              <li
                key={reel.id}
                style={cardStyle(offset)}
                aria-hidden={!isActive}
                className="absolute left-1/2 top-2 h-[420px] w-[260px] origin-center transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(.22,.8,.24,1)] motion-reduce:transition-none md:h-[480px] md:w-[320px]"
              >
                <button
                  type="button"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onCardClick(index)}
                  aria-label={
                    isActive
                      ? `${es ? 'Ver a pantalla completa' : 'View full screen'}: ${reel.title[lang]}, ${reel.location}`
                      : `${es ? 'Ir a' : 'Go to'} ${reel.title[lang]}`
                  }
                  className="group relative block h-full w-full overflow-hidden rounded-[28px] bg-brand text-left shadow-[0_24px_50px_-18px_rgba(10,43,48,.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <Picture
                    src={reel.thumbnail}
                    sizes="(min-width: 768px) 320px, 260px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    width={320}
                    height={568}
                    style={reel.focus ? { objectPosition: reel.focus } : undefined}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,43,48,0)_45%,rgba(10,43,48,.85)_100%)]" />

                  {/*
                    Lo que sigue solo en la carta activa: en las vecinas sería
                    texto ilegible a medio tamaño y competiría con la del centro.
                  */}
                  <span
                    className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {/* Panel de vidrio con los datos del lugar. */}
                    <span className="absolute left-3 top-3 flex w-[96px] flex-col divide-y divide-white/20 rounded-2xl border border-white/25 bg-white/15 text-center text-white backdrop-blur-md md:left-4 md:top-4 md:w-[104px]">
                      <span className="flex flex-col items-center gap-1 px-2 py-3">
                        <MapPin size={16} aria-hidden="true" />
                        <span className="text-[11px] font-semibold leading-tight">{reel.location}</span>
                      </span>
                      <span className="flex flex-col items-center gap-1 px-2 py-3">
                        {isVideo ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Expand size={16} aria-hidden="true" />}
                        <span className="text-[11px] font-semibold leading-tight">
                          {isVideo ? (es ? 'Vídeo' : 'Video') : es ? 'Foto' : 'Photo'}
                        </span>
                      </span>
                      {reel.experienceId && (
                        <span className="flex flex-col items-center gap-1 px-2 py-3">
                          <Compass size={16} aria-hidden="true" />
                          <span className="text-[11px] font-semibold leading-tight">{es ? 'Con experiencia' : 'Bookable'}</span>
                        </span>
                      )}
                    </span>

                    {/* Franja oscura con el título en vertical, como en la referencia. */}
                    <span className="absolute inset-y-0 right-0 flex w-14 items-end justify-center bg-[#0b2226]/90 pb-5 md:w-16">
                      <span className="whitespace-nowrap text-3xl font-semibold tracking-tight text-white [writing-mode:vertical-rl] rotate-180 md:text-4xl">
                        {reel.title[lang]}
                      </span>
                    </span>

                    <span className="absolute bottom-4 left-4 right-20 text-white md:right-24">
                      <span className="block text-[11px] font-bold uppercase tracking-[.16em] text-gold-soft">
                        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                        {es ? 'Toca para verlo' : 'Tap to view'}
                        <ChevronRight size={15} aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Controles: flechas a los lados de los puntos. */}
      <div className="mx-auto mt-2 flex max-w-7xl items-center justify-center gap-5 px-5">
        <button type="button" onClick={() => step(-1)} className={arrow} aria-label={es ? 'Lugar anterior' : 'Previous place'}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1.5">
          {reels.map((reel, index) => (
            <button
              key={reel.id}
              type="button"
              onClick={() => go(index)}
              aria-label={`${es ? 'Ir a' : 'Go to'} ${reel.title[lang]}`}
              aria-current={index === current}
              className={`h-2 rounded-full transition-all duration-300 ${index === current ? 'w-6 bg-accent' : 'w-2 bg-line hover:bg-muted'}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => step(1)} className={arrow} aria-label={es ? 'Lugar siguiente' : 'Next place'}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {activeReel.title[lang]}, {activeReel.location} ({current + 1} / {total})
      </p>

      {viewer !== null && (
        <ReelViewer
          index={viewer}
          onIndexChange={(index) => {
            setViewer(index)
            go(index)
          }}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  )
}
