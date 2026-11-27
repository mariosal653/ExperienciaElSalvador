import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { guides } from '@/lib/guides'
import type { Locale } from '@/lib/data'

/**
 * «Ideas para tu viaje»: itinerarios cortos que combinan experiencias del
 * catálogo y el Personal Driver. Venden con una idea de viaje, no con un
 * producto suelto, y presentan a la casa como quien conoce el país.
 */
export function GuidesSection({ lang }: { lang: Locale }) {
  const es = lang === 'ES'

  return (
    <section id="ideas" aria-labelledby="ideas-title" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-accent">{es ? 'Ideas para tu viaje' : 'Trip ideas'}</p>
          <h2 id="ideas-title" className="text-3xl font-semibold tracking-tight md:text-4xl">
            {es ? <>Rutas armadas por <em className="font-serif font-normal">locales</em></> : <>Routes planned by <em className="font-serif font-normal">locals</em></>}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          {es
            ? 'Itinerarios probados para aprovechar tus días. Tómalos tal cual o cámbialos a tu gusto.'
            : 'Tried-and-tested itineraries to make the most of your days. Take them as they are or adjust them to your taste.'}
        </p>
      </div>

      <ul className="grid gap-5 md:grid-cols-3">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guias/${guide.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className="relative block aspect-[16/10] overflow-hidden bg-surface-mint">
                <Picture
                  src={guide.image.src}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  alt={guide.image.alt[lang]}
                  loading="lazy"
                  decoding="async"
                  width={640}
                  height={400}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-brand shadow-sm">
                  <CalendarDays size={12} aria-hidden="true" />
                  {guide.length[lang]}
                </span>
              </span>
              <span className="flex flex-1 flex-col p-5">
                <span className="text-lg font-bold leading-snug text-brand">{guide.title[lang]}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{guide.summary[lang]}</span>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-accent">
                  {es ? 'Ver la ruta' : 'See the route'}
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
