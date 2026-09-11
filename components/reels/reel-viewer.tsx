'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { reels, type Reel } from '@/lib/reels'

/** Duración de un reel sin vídeo (foto con movimiento), en milisegundos. */
const PHOTO_DURATION_MS = 7000

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** ¿Puede este navegador reproducir alguna de las fuentes? */
function playableSources(reel: Reel): Reel['videoSources'] {
  if (typeof document === 'undefined') return []
  const probe = document.createElement('video')
  return reel.videoSources.filter((source) => probe.canPlayType(source.type) !== '')
}

/**
 * Visor de reels a pantalla completa.
 *
 * Usa <dialog> nativo con showModal(): el navegador lo pone en la «capa
 * superior», por encima de cualquier z-index (header, WhatsApp), atrapa
 * el foco dentro y cierra con Escape sin código extra.
 *
 * Navegación: flechas en pantalla, teclado (← → ↑ ↓), toque en los lados
 * y deslizar arriba/abajo o izquierda/derecha en móvil.
 *
 * Solo el reel ACTIVO tiene un <video> en el DOM: los demás no descargan
 * nada. El vídeo empieza silenciado (única forma de reproducción
 * automática permitida por los navegadores móviles).
 */
export function ReelViewer({
  index,
  onIndexChange,
  onClose,
}: {
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const reel = reels[index]
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(() => prefersReducedMotion())
  const [videoFailed, setVideoFailed] = useState(false)
  const [progress, setProgress] = useState(0)

  const sources = useMemo(() => playableSources(reel), [reel])
  const showVideo = sources.length > 0 && !videoFailed

  const hasNext = index < reels.length - 1
  const hasPrev = index > 0

  const next = useCallback(() => {
    if (index < reels.length - 1) onIndexChange(index + 1)
  }, [index, onIndexChange])
  const prev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1)
  }, [index, onIndexChange])

  // Abrir como modal y bloquear el scroll de la página mientras tanto.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])

  // Al cambiar de reel: reinicia el estado del medio.
  useEffect(() => {
    setVideoFailed(false)
    setProgress(0)
    // Adelanta la imagen del siguiente para que el cambio sea inmediato.
    const upcoming = reels[index + 1]
    if (upcoming) {
      const image = new Image()
      image.src = upcoming.poster
    }
  }, [index])

  // Pausa / reanuda el vídeo.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused) video.pause()
    else video.play().catch(() => setPaused(true))
  }, [paused, index, showVideo])

  // Teclado. Escape lo gestiona el propio <dialog>.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return
    // Deslizar hacia arriba o hacia la izquierda = siguiente.
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) next()
      else prev()
    } else if (dx < 0) next()
    else prev()
  }

  const credit = reel.credit

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={() => onClose()}
      aria-label={`${reel.title[lang]} · ${reel.location}`}
      className="reel-dialog m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-white"
    >
      <div className="flex h-full w-full items-center justify-center gap-4 bg-[#071f22]/95 sm:p-6">
        {/* Anterior (escritorio) */}
        <button
          type="button"
          onClick={prev}
          disabled={!hasPrev}
          aria-label={es ? 'Reel anterior' : 'Previous reel'}
          className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25 sm:grid"
        >
          <ChevronLeft size={24} />
        </button>

        <div
          className="relative h-full w-full overflow-hidden bg-black sm:aspect-[9/16] sm:h-[min(88vh,820px)] sm:w-auto sm:rounded-3xl"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Medio */}
          {showVideo ? (
            <video
              key={reel.id}
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              poster={reel.poster}
              style={reel.focus ? { objectPosition: reel.focus } : undefined}
              muted={muted}
              playsInline
              autoPlay={!paused}
              preload="metadata"
              onEnded={next}
              onError={() => setVideoFailed(true)}
              onTimeUpdate={(event) => {
                const video = event.currentTarget
                if (video.duration) setProgress(video.currentTime / video.duration)
              }}
            >
              {sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
          ) : (
            <img
              key={reel.id}
              src={reel.poster}
              alt=""
              decoding="async"
              className="reel-kenburns absolute inset-0 h-full w-full object-cover"
              style={{ animationPlayState: paused ? 'paused' : 'running', objectPosition: reel.focus }}
            />
          )}

          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0)_55%,rgba(0,0,0,.8)_100%)]" />

          {/* Progreso: una barra por reel */}
          <div className="absolute inset-x-3 top-3 flex gap-1" aria-hidden="true">
            {reels.map((item, i) => (
              <span key={item.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                {i < index && <span className="block h-full w-full bg-white" />}
                {i === index &&
                  (showVideo ? (
                    <span className="block h-full bg-white" style={{ width: `${progress * 100}%` }} />
                  ) : (
                    <span
                      key={reel.id}
                      className="reel-progress block h-full bg-white"
                      style={{
                        animationDuration: `${PHOTO_DURATION_MS}ms`,
                        animationPlayState: paused ? 'paused' : 'running',
                      }}
                      onAnimationEnd={next}
                    />
                  ))}
              </span>
            ))}
          </div>

          {/* Cabecera */}
          <div className="absolute inset-x-3 top-6 flex items-start justify-between gap-3">
            <div className="min-w-0 pt-1">
              <p className="truncate text-base font-semibold">{reel.title[lang]}</p>
              <p className="flex items-center gap-1 text-xs text-white/80">
                <MapPin size={12} /> {reel.location}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? (es ? 'Reproducir' : 'Play') : es ? 'Pausar' : 'Pause'}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55"
              >
                {paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
              </button>
              {showVideo && (
                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  aria-label={muted ? (es ? 'Activar sonido' : 'Unmute') : es ? 'Silenciar' : 'Mute'}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55"
                >
                  {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => dialogRef.current?.close()}
                aria-label={es ? 'Cerrar' : 'Close'}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Zonas táctiles: tercio izquierdo = anterior, derecho = siguiente */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={prev}
            className="absolute bottom-32 left-0 top-24 w-1/3 cursor-w-resize sm:hidden"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={next}
            className="absolute bottom-32 right-0 top-24 w-1/3 cursor-e-resize sm:hidden"
          />

          {/* Pie */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {reel.experienceId && (
              <a
                href={`/experiences/${reel.experienceId}`}
                className="flex items-center justify-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#963b18]"
              >
                {es ? 'Ver experiencia' : 'View Experience'} <ArrowRight size={16} />
              </a>
            )}
            <div className="flex items-center justify-between gap-3 text-[10px] leading-tight text-white/65">
              <a href={credit.source} target="_blank" rel="noopener noreferrer" className="truncate underline-offset-2 hover:underline">
                {reel.videoUrl && showVideo ? (es ? 'Vídeo' : 'Video') : es ? 'Foto' : 'Photo'}: {credit.author} · {credit.license}
              </a>
              {hasNext && (
                <button type="button" onClick={next} className="flex shrink-0 items-center gap-1 font-semibold text-white/85 sm:hidden">
                  {es ? 'Siguiente' : 'Next'} <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Siguiente (escritorio) */}
        <button
          type="button"
          onClick={next}
          disabled={!hasNext}
          aria-label={es ? 'Siguiente reel' : 'Next reel'}
          className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25 sm:grid"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </dialog>
  )
}
