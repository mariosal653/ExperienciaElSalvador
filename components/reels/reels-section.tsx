'use client'

import { useState } from 'react'
import { Play, Clapperboard } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { reels } from '@/lib/reels'
import { ReelViewer } from './reel-viewer'

/**
 * Tira de reels verticales de la portada.
 *
 * Rendimiento: las miniaturas llevan loading="lazy" y ningún vídeo se
 * descarga hasta que el visitante abre un reel. La sección no compite con
 * la imagen del héroe por el LCP.
 */
export function ReelsSection() {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const [active, setActive] = useState<number | null>(null)

  return (
    <section id="reels" aria-labelledby="reels-title" className="mx-auto max-w-7xl px-5 pt-14 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">
            {es ? 'Reels' : 'Reels'}
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
        </div>
        <p className="hidden max-w-xs text-right text-sm text-[#6a8588] sm:block">
          {es ? 'Toca un reel para verlo en pantalla completa.' : 'Tap a reel to watch it full screen.'}
        </p>
      </div>

      {/*
        Móvil: carrusel horizontal con snap. Escritorio: todas a la vista.
        El margen negativo deja que el carrusel llegue al borde de la
        pantalla sin romper el ancho de la página.
      */}
      <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
        {reels.map((reel, index) => (
          <li key={reel.id} className="w-[38vw] max-w-[180px] shrink-0 snap-start sm:w-44 lg:w-auto lg:max-w-none">
            <button
              type="button"
              onClick={() => setActive(index)}
              className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[#173f45] text-left shadow-[0_8px_30px_rgba(26,65,69,.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8481c]"
              aria-label={`${es ? 'Ver reel' : 'Watch reel'}: ${reel.title[lang]}, ${reel.location}`}
            >
              <img
                src={reel.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                width={320}
                height={568}
                style={reel.focus ? { objectPosition: reel.focus } : undefined}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,43,48,0)_45%,rgba(10,43,48,.85)_100%)]" />
              <span className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#173f45] shadow">
                {reel.videoUrl ? <Clapperboard size={15} /> : <Play size={15} fill="currentColor" />}
              </span>
              <span className="absolute inset-x-0 bottom-0 p-3 text-white">
                <span className="block text-sm font-semibold leading-tight">{reel.title[lang]}</span>
                <span className="mt-0.5 block text-[11px] text-white/80">{reel.location}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active !== null && (
        <ReelViewer index={active} onIndexChange={setActive} onClose={() => setActive(null)} />
      )}
    </section>
  )
}
