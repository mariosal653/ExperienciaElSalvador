'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  Heart,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { SearchPanel } from '@/components/search/search-panel'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { useLanguage } from '@/components/i18n/language-provider'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { WelcomeModal } from '@/components/benefits/welcome-modal'
import { ReelsSection } from '@/components/reels/reels-section'
import { ServicesSection } from '@/components/services/services-section'
import { HeroVideo } from '@/components/home/hero-video'
import { SiteFooter } from '@/components/site/site-footer'
import { HomeHeader } from '@/components/site/home-header'
import { DestinationName, DestinationPhoto } from '@/components/destination/destination-transition'
import { useReviewStats } from '@/components/reviews/use-review-stats'
import { ExperienceCard } from '@/components/experience/experience-card'
import { Reveal } from '@/components/ui/reveal'
import { useFavorites } from '@/components/favorites/use-favorites'
import {
  applyRefinements,
  emptyRefinements,
  hasRefinements,
  PRICE_STEPS,
  sortExperiences,
  type Refinements,
  type SortKey,
} from '@/lib/catalog-filters'
import { destinationPages } from '@/lib/destination-details'
import {
  emptyCriteria,
  filterExperiences,
  hasActiveCriteria,
  isBookableOnline,
  parseLocalDate,
  type Locale,
  type SearchCriteria,
} from '@/lib/data'

/**
 * Destinos con experiencias; cada uno tiene su página en /destinos/<id>.
 * Los primeros de LEAD_ORDER abren la composición de la portada, en ese
 * orden; el primero va en grande. El resto conserva el orden del catálogo.
 */
const LEAD_ORDER = ['volcan-de-santa-ana', 'lago-de-coatepeque', 'suchitoto', 'ruta-de-las-flores', 'el-tunco']
const DESTINATION_TILES = destinationPages().sort((a, b) => {
  const rank = (id: string) => (LEAD_ORDER.includes(id) ? LEAD_ORDER.indexOf(id) : LEAD_ORDER.length)
  return rank(a.destination.id) - rank(b.destination.id)
})
/** Destinos visibles antes de pulsar «Ver todos»: uno grande y cuatro medianos. */
const FEATURED_DESTINATIONS = 5

const SORT_LABEL: Record<SortKey, Record<Locale, string>> = {
  recommended: { ES: 'Recomendadas', EN: 'Recommended' },
  priceAsc: { ES: 'Precio: menor a mayor', EN: 'Price: low to high' },
  priceDesc: { ES: 'Precio: mayor a menor', EN: 'Price: high to low' },
  rating: { ES: 'Mejor valoradas', EN: 'Top rated' },
  duration: { ES: 'Más cortas primero', EN: 'Shortest first' },
}

const MONTHS_SHORT: Record<Locale, string[]> = {
  ES: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  EN: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

function formatDate(iso: string, lang: Locale): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  return `${date.getDate()} ${MONTHS_SHORT[lang][date.getMonth()]}`
}

/**
 * Página de inicio (cliente). `app/page.tsx` la envuelve en un componente
 * de servidor que añade metadatos y datos estructurados; el HTML de esta
 * vista se genera igualmente en el servidor, así que el catálogo llega
 * completo a los buscadores.
 */
export function HomeView() {
  const { lang: language } = useLanguage()
  const { ids: favorites, toggle: toggleFavorite } = useFavorites()
  const [onlySaved, setOnlySaved] = useState(false)
  const [refine, setRefine] = useState<Refinements>(emptyRefinements)
  const [sort, setSort] = useState<SortKey>('recommended')
  const [allDestinations, setAllDestinations] = useState(false)
  const visibleTiles = allDestinations ? DESTINATION_TILES : DESTINATION_TILES.slice(0, FEATURED_DESTINATIONS)
  const stats = useReviewStats()

  /**
   * «Hoy» solo se calcula en el navegador, tras montar: si el servidor y el
   * navegador cayeran en días distintos (cerca de medianoche), la próxima
   * salida no coincidiría y React avisaría de un desajuste de hidratación.
   */
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  // Sin favoritos no tiene sentido el filtro «Guardadas».
  useEffect(() => {
    if (favorites.length === 0) setOnlySaved(false)
  }, [favorites.length])

  /** Criterios ya aplicados. `null` = todavía no se ha buscado. */
  const [applied, setApplied] = useState<SearchCriteria | null>(null)

  /**
   * Se incrementa al limpiar filtros. Sirve de `key` del buscador para que
   * vuelva a montarse con los valores por defecto: si no, el borrador
   * interno seguiría mostrando el destino anterior.
   */
  const [formKey, setFormKey] = useState(0)

  const criteria = applied ?? emptyCriteria
  const results = useMemo(
    () =>
      sortExperiences(
        applyRefinements(filterExperiences(criteria, null), refine).filter(
          (item) => !onlySaved || favorites.includes(item.id),
        ),
        sort,
        stats,
      ),
    [criteria, refine, onlySaved, favorites, sort, stats],
  )

  const bookable = results.filter(isBookableOnline)
  const onRequest = results.filter((item) => !isBookableOnline(item))

  const isFiltered =
    (applied !== null && hasActiveCriteria(applied)) || onlySaved || hasRefinements(refine)

  // Si el visitante ya buscó, el checkout llega con su fecha y viajeros.
  const bookQuery = useMemo(() => {
    const query = new URLSearchParams()
    if (applied?.date) query.set('date', applied.date)
    if (applied && applied.people !== emptyCriteria.people) query.set('people', String(applied.people))
    return query.toString()
  }, [applied])

  // Publica el contexto para el widget de WhatsApp: si el visitante ya
  // busco, el mensaje llegara con destino, fecha y numero de viajeros.
  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({
      lang: language,
      destination: applied?.destination ?? null,
      date: applied?.date ?? null,
      people: applied ? applied.people : null,
    })
  }, [language, applied, setLead])

  function resetAll() {
    setApplied(null)
    setOnlySaved(false)
    setRefine(emptyRefinements)
    setFormKey((value) => value + 1)
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
      active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-brand hover:bg-surface-mint'
    }`

  const es = language === 'ES'

  return (
    <main className="min-h-screen bg-cream text-brand">
      <WelcomeModal />
      <HomeHeader />

      {/*
        Sin `overflow-hidden`: recortaba los desplegables del destino y del
        calendario al salirse del héroe. La imagen y los degradados están en
        `absolute inset-0`, así que no se desbordan por sí solos.
      */}
      <section id="inicio" className="relative flex min-h-[620px] items-center bg-brand-hero pt-24">
        {/*
          RESPALDO, no velo: va ANTES de la foto en el orden del documento,
          así que queda DEBAJO de ella y solo se ve si la imagen no carga.
          El velo que sostiene el texto es el de después del vídeo.
        */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,48,.86)_0%,rgba(10,43,48,.55)_45%,rgba(10,43,48,.15)_100%)]" />
        {/*
          Imagen del LCP: prioridad alta y tamaños por ancho de pantalla.
          Cerro Verde y el volcán de Izalco (créditos en lib/credits.ts). El
          Izalco está a la derecha de la foto: en móvil, donde el recorte
          vertical es fuerte, se desplaza el encuadre para que no quede fuera.
        */}
        <Picture
          src="/img/hero/cerro-verde-izalco-1920.jpg"
          srcSet="/img/hero/cerro-verde-izalco-960.jpg 960w, /img/hero/cerro-verde-izalco-1920.jpg 1920w"
          sizes="100vw"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          alt={es ? 'Cerro Verde y el volcán de Izalco, El Salvador' : 'Cerro Verde and Izalco volcano, El Salvador'}
          className="absolute inset-0 h-full w-full object-cover object-[74%_50%] md:object-center"
        />
        {/*
          Vídeo de inicio, encima de la foto y debajo del degradado: así el
          texto del héroe conserva el mismo contraste con vídeo y sin él.
          Sin vídeo configurado no dibuja nada (ver lib/hero-video.ts).
        */}
        <HeroVideo />
        {/*
          El velo. Dos degradados en una sola capa, cada uno con su trabajo:

          90deg  oscurece el LADO DEL TEXTO y abre el derecho, que es donde
                 está el cono del Izalco. Antes el velo era uniforme (.35 →
                 .1): daba poco contraste al titular blanco sobre el cielo
                 claro y, aun así, apagaba el volcán.

          180deg asienta la cabecera arriba y cierra abajo con un teal muy
                 leve. Antes terminaba en crema al 90 %, que borraba el
                 tercio inferior de la foto —se pagaban 520 KB de JPG para
                 taparlo— y dejaba una banda gris sucia bajo el buscador.
        */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,48,.72)_0%,rgba(10,43,48,.38)_52%,rgba(10,43,48,.05)_100%),linear-gradient(180deg,rgba(12,55,61,.30)_0%,transparent_38%,rgba(12,55,61,.18)_100%)]" />
        {/*
          Capa 30. Este div crea el contexto de apilamiento donde viven los
          desplegables del buscador, así que su z decide si el buscador queda
          por encima de la tira de categorías (capa 20) o por debajo.
        */}
        <div className="relative z-30 mx-auto w-full max-w-7xl px-5 pb-28 pt-16 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[.22em] text-gold-soft"><span className="h-px w-8 bg-gold-soft" />{es ? 'Viaja con propósito' : 'Travel with purpose'}</p>
            <h1 className="text-5xl font-semibold leading-[.98] tracking-[-.04em] md:text-7xl">El Salvador, <em className="font-serif font-normal text-gold-deep">{es ? 'a tu manera.' : 'your way.'}</em></h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">{es ? 'Descubre lugares que se sienten como un secreto. Experiencias locales, recuerdos que se quedan.' : 'Discover places that feel like a secret. Local experiences, memories that stay.'}</p>
          </div>

          <SearchPanel key={formKey} applied={applied} onSearch={setApplied} lang={language} />

          {applied && (
            <p className="on-dark mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white">
              <span>
                {results.length}{' '}
                {es
                  ? results.length === 1 ? 'experiencia encontrada' : 'experiencias encontradas'
                  : results.length === 1 ? 'experience found' : 'experiences found'}
              </span>
              <a href="#experiencias" className="font-bold text-gold-deep underline underline-offset-4">
                {es ? 'Ver resultados' : 'See results'}
              </a>
            </p>
          )}
        </div>
      </section>

      {/*
        Destinos, justo debajo del buscador: quien llega sin un plan claro
        empieza por el lugar, no por la experiencia.
      */}
      <section id="destinos" className="section-y mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="on-dark rounded-[2rem] bg-brand p-7 text-white md:p-12 lg:p-14">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">{es ? 'Destinos' : 'Destinations'}</p>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
                {es ? <>Elige a dónde <em className="font-serif font-normal text-gold-deep">ir primero.</em></> : <>Choose where to <em className="font-serif font-normal text-gold-deep">go first.</em></>}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              {es ? 'Cada destino tiene su página con todas sus experiencias.' : 'Each destination has its own page with all of its experiences.'}
            </p>
          </div>
          {/*
            Composición de revista: un destino protagonista y cuatro
            secundarios. Los demás esperan detrás de «Ver todos»: trece
            fotos iguales parecían un directorio, no una invitación.
          */}
          <ul id="destinos-lista" className="mt-10 grid auto-rows-[11rem] grid-cols-2 gap-3 md:auto-rows-[13rem] md:grid-cols-4 md:gap-4">
            {visibleTiles.map((tile, index) => {
              const lead = index === 0
              return (
                <li key={tile.destination.id} className={lead ? 'col-span-2 row-span-2' : ''}>
                  <Link
                    href={`/destinos/${tile.destination.id}`}
                    className="group relative block h-full w-full overflow-hidden rounded-card text-left"
                  >
                    {/* Foto y nombre se transforman en el héroe de /destinos/[id]: ver DestinationPhoto. */}
                    <DestinationPhoto id={tile.destination.id} className="absolute inset-0 overflow-hidden rounded-card">
                      <Picture src={tile.image.src} sizes={lead ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'} alt={tile.image.alt[language]} loading="lazy" decoding="async" width={lead ? 960 : 480} height={lead ? 720 : 360} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    </DestinationPhoto>
                    <span className={`absolute inset-x-4 bottom-4 ${lead ? 'md:inset-x-6 md:bottom-6' : ''}`}>
                      <span className="block text-[11px] font-semibold uppercase tracking-[.16em] text-white/75">{tile.destination.region[language]}</span>
                      <DestinationName id={tile.destination.id}>
                        <span className={`mt-0.5 flex items-center gap-1.5 font-semibold leading-tight ${lead ? 'text-2xl md:text-4xl' : 'text-base'}`}>
                          {tile.destination.name}
                          <ArrowRight size={lead ? 22 : 14} className="shrink-0 transition group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </DestinationName>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {DESTINATION_TILES.length > FEATURED_DESTINATIONS && (
            <button
              type="button"
              onClick={() => setAllDestinations((value) => !value)}
              aria-expanded={allDestinations}
              aria-controls="destinos-lista"
              className="mt-8 inline-flex items-center gap-2 rounded-control border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
            >
              {allDestinations
                ? es ? 'Ver menos destinos' : 'Show fewer destinations'
                : es ? `Ver los ${DESTINATION_TILES.length} destinos` : `See all ${DESTINATION_TILES.length} destinations`}
              <ChevronDown size={16} className={`transition ${allDestinations ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </Reveal>
      </section>

      {/*
        Servicios principales, justo después de los destinos (acuerdo 01):
        nada secundario desplaza las dos ofertas de transporte de la parte
        principal de la página. La tira de categorías se retiró de la
        portada a petición del cliente.
      */}
      <ServicesSection />

      {/* Reels: debajo de los servicios principales, antes del catálogo. */}
      <ReelsSection />

      <section id="experiencias" className="section-y mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{es ? 'Imperdibles' : 'Must-dos'}</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {es ? <>Experiencias que <em className="font-serif font-normal">dejan huella</em></> : <>Experiences that <em className="font-serif font-normal">leave a mark</em></>}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              {es ? 'Reserva en línea con confirmación inmediata, o pídenos una a tu medida.' : 'Book online with instant confirmation, or ask us for one made to measure.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="sr-only text-sm text-muted sm:not-sr-only" aria-live="polite">
              {results.length} {es ? (results.length === 1 ? 'experiencia' : 'experiencias') : results.length === 1 ? 'experience' : 'experiences'}
            </p>
            {favorites.length > 0 && (
              <button
                onClick={() => setOnlySaved((value) => !value)}
                aria-pressed={onlySaved}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition ${onlySaved ? 'border-accent bg-accent text-white' : 'border-line text-brand hover:bg-surface-mint'}`}
              >
                <Heart size={14} fill={onlySaved ? '#fff' : 'none'} />
                {es ? 'Guardadas' : 'Saved'} ({favorites.length})
              </button>
            )}
          </div>
        </div>

        {/* Filtros finos y orden: en móvil se deslizan en horizontal. */}
        <div className="mb-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* `relative`: sin él, el .sr-only de "Precio máximo" se posiciona respecto a <body>, escapa del recorte y ensancha toda la página en móvil. */}
          <div className="relative -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label={es ? 'Filtros' : 'Filters'}>
            <SlidersHorizontal size={16} className="shrink-0 text-muted" aria-hidden="true" />
            <button aria-pressed={refine.duration === 'half'} onClick={() => setRefine((r) => ({ ...r, duration: r.duration === 'half' ? 'any' : 'half' }))} className={chip(refine.duration === 'half')}>
              {es ? 'Medio día (hasta 5 h)' : 'Half day (up to 5 h)'}
            </button>
            <button aria-pressed={refine.duration === 'full'} onClick={() => setRefine((r) => ({ ...r, duration: r.duration === 'full' ? 'any' : 'full' }))} className={chip(refine.duration === 'full')}>
              {es ? 'Día completo' : 'Full day'}
            </button>
            <button aria-pressed={refine.family} onClick={() => setRefine((r) => ({ ...r, family: !r.family }))} className={chip(refine.family)}>
              {es ? 'Para familias' : 'Family friendly'}
            </button>
            <button aria-pressed={refine.easy} onClick={() => setRefine((r) => ({ ...r, easy: !r.easy }))} className={chip(refine.easy)}>
              {es ? 'Dificultad fácil' : 'Easy'}
            </button>
            {/* `appearance-none` quita la flecha del navegador; se dibuja una
                propia para que se vea que es un desplegable. */}
            <label className="relative shrink-0">
              <span className="sr-only">{es ? 'Precio máximo' : 'Maximum price'}</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${refine.maxPrice !== null ? 'text-white' : 'text-brand'}`}
              />
              <select
                value={refine.maxPrice ?? ''}
                onChange={(event) => setRefine((r) => ({ ...r, maxPrice: event.target.value ? Number(event.target.value) : null }))}
                className={`${chip(refine.maxPrice !== null)} cursor-pointer appearance-none pr-8`}
              >
                <option value="">{es ? 'Cualquier precio' : 'Any price'}</option>
                {PRICE_STEPS.map((price) => (
                  <option key={price} value={price}>{es ? `Hasta $${price}` : `Up to $${price}`}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted">
            <ArrowUpDown size={15} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{es ? 'Ordenar:' : 'Sort:'}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="cursor-pointer rounded-full border border-line bg-white px-3.5 py-2 text-xs font-bold text-brand"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                <option key={key} value={key}>{SORT_LABEL[key][language]}</option>
              ))}
            </select>
          </label>
        </div>

        {isFiltered && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {applied?.destination && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-mint px-3 py-1.5 text-xs font-semibold text-brand"><MapPin size={13} />{applied.destination}</span>
            )}
            {applied?.date && (
              <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-semibold text-brand">{formatDate(applied.date, language)}</span>
            )}
            {applied && applied.people !== emptyCriteria.people && (
              <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-semibold text-brand">
                {applied.people} {es ? (applied.people === 1 ? 'viajero' : 'viajeros') : applied.people === 1 ? 'traveler' : 'travelers'}
              </span>
            )}
            {onlySaved && (
              <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-dark">
                <Heart size={12} fill="currentColor" />
                {es ? 'Solo guardadas' : 'Saved only'}
              </span>
            )}
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-surface-mint"
            >
              <RotateCcw size={13} />
              {es ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          </div>
        )}

        {/*
          Dos grupos con dos pesos distintos. Arriba, grandes, los tours que
          se reservan y pagan aquí: son lo que la web vende. Debajo, más
          sobrios, los que se cotizan. Los filtros y el orden se aplican a
          los dos por igual.
        */}
        {bookable.length > 0 && (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {bookable.map((item) => (
              <ExperienceCard
                key={item.id}
                item={item}
                lang={language}
                stats={stats}
                now={now}
                saved={favorites.includes(item.id)}
                onToggleSave={toggleFavorite}
                bookQuery={bookQuery}
                variant="feature"
              />
            ))}
          </div>
        )}

        {onRequest.length > 0 && (
          <div className={bookable.length > 0 ? 'mt-20 border-t border-line pt-12' : ''}>
            {bookable.length > 0 && (
              <div className="mb-8 max-w-2xl">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {es ? <>Experiencias <em className="font-serif font-normal">a medida</em></> : <>Tailor-made <em className="font-serif font-normal">experiences</em></>}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {es
                    ? 'Las organizamos para tu grupo. Te confirmamos fecha y precio final por WhatsApp o correo.'
                    : 'We organize them for your group. We confirm the date and final price by WhatsApp or email.'}
                </p>
              </div>
            )}
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {onRequest.map((item) => (
                <ExperienceCard
                  key={item.id}
                  item={item}
                  lang={language}
                  stats={stats}
                  now={now}
                  saved={favorites.includes(item.id)}
                  onToggleSave={toggleFavorite}
                  bookQuery={bookQuery}
                />
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && (
          <div className="rounded-card border border-line bg-white p-10 text-center">
            <p className="text-lg font-semibold text-brand">
              {es ? 'No encontramos experiencias con estos criterios.' : 'No experiences match these filters.'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {es ? 'Prueba cambiando el destino o las fechas.' : 'Try changing the destination or the dates.'}
            </p>
            <button
              onClick={resetAll}
              className="mt-6 inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <RotateCcw size={16} />
              {es ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          </div>
        )}
      </section>

      <ReviewsSection />

      <section id="como-funciona" className="section-y bg-sand">
        <Reveal className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-end gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="eyebrow">{es ? 'Viajar es fácil' : 'Travel made easy'}</p>
              <h2 className="max-w-md text-3xl font-semibold tracking-tight md:text-5xl">
                {es ? <>Lo local se vive <em className="font-serif font-normal">mejor.</em></> : <>Local is simply <em className="font-serif font-normal">better.</em></>}
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted">
                {es
                  ? 'Conectamos tus ganas de explorar con quienes conocen cada rincón de El Salvador. Tú eliges el plan, nosotros cuidamos los detalles.'
                  : 'We connect your urge to explore with the people who know every corner of El Salvador. You pick the plan, we handle the details.'}
              </p>
              <a href="#experiencias" className="mt-8 inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark">
                {es ? 'Elegir mi experiencia' : 'Choose my experience'} <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            {/* Pasos sin caja: una línea arriba y el número en serif bastan para ordenarlos. */}
            <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
              {(es
                ? [['01', 'Elige', 'Encuentra el destino o experiencia que te mueve.'], ['02', 'Reserva', 'Confirma en pocos pasos y recibe todo al instante.'], ['03', 'Disfruta', 'Vive el momento con anfitriones locales.']]
                : [['01', 'Choose', 'Find the destination or experience that moves you.'], ['02', 'Book', 'Confirm in a few steps and get everything instantly.'], ['03', 'Enjoy', 'Live the moment with local hosts.']]
              ).map(([number, title, description]) => (
                <li key={number} className="border-t border-brand/20 pt-5">
                  <span className="font-serif text-4xl text-gold-ink" aria-hidden="true">{number}</span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
