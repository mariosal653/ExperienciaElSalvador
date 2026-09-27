'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Compass,
  Heart,
  MapPin,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Waves,
  X,
} from 'lucide-react'
import { SearchPanel } from '@/components/search/search-panel'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { useLanguage } from '@/components/i18n/language-provider'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { SessionNav } from '@/components/auth/session-nav'
import { WelcomeModal } from '@/components/benefits/welcome-modal'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { ReelsSection } from '@/components/reels/reels-section'
import { SiteFooter } from '@/components/site/site-footer'
import { RatingBadge } from '@/components/reviews/rating-badge'
import { useReviewStats } from '@/components/reviews/use-review-stats'
import { departureLabel, nextDepartures } from '@/lib/departures'
import { FREE_CANCELLATION_HOURS } from '@/lib/experience-details'
import {
  categories,
  emptyCriteria,
  experienceName,
  experiences,
  filterExperiences,
  hasActiveCriteria,
  parseLocalDate,
  type CategoryId,
  type Locale,
  type SearchCriteria,
} from '@/lib/data'

/** Iconos de la tira de categorías, resueltos por clave. */
const CATEGORY_ICONS = {
  waves: Waves,
  compass: Compass,
  sparkles: Sparkles,
  shield: ShieldCheck,
} as const

const FAVORITES_KEY = 'ees:favorites'

type DestinationTile = { name: string; image: string; alt: Record<Locale, string>; count: number }

/**
 * Destinos con al menos una experiencia, para la sección «Destinos»: la
 * foto es la de su primera experiencia y el contador dice cuántas hay.
 */
const DESTINATION_TILES: DestinationTile[] = Array.from(
  experiences
    .reduce((map, item) => {
      const tile = map.get(item.destination)
      if (tile) tile.count += 1
      else map.set(item.destination, { name: item.destination, image: item.image, alt: item.imageAlt, count: 1 })
      return map
    }, new Map<string, DestinationTile>())
    .values(),
)

const MONTHS_SHORT: Record<Locale, string[]> = {
  ES: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  EN: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

function formatDate(iso: string, lang: Locale): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  return `${date.getDate()} ${MONTHS_SHORT[lang][date.getMonth()]}`
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang: language, setLang } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [onlySaved, setOnlySaved] = useState(false)
  const stats = useReviewStats()

  /**
   * «Hoy» solo se calcula en el navegador, tras montar: si el servidor y el
   * navegador cayeran en días distintos (cerca de medianoche), la próxima
   * salida no coincidiría y React avisaría de un desajuste de hidratación.
   */
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  // Favoritos: se recuerdan en este navegador. Si el almacenamiento está
  // bloqueado (modo privado estricto), la página funciona igual sin ellos.
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
      if (Array.isArray(saved)) setFavorites(saved.filter((id): id is string => typeof id === 'string'))
    } catch {}
  }, [])

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      } catch {}
      if (next.length === 0) setOnlySaved(false)
      return next
    })
  }

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
      filterExperiences(criteria, activeCategory).filter((item) => !onlySaved || favorites.includes(item.id)),
    [criteria, activeCategory, onlySaved, favorites],
  )

  const isFiltered = (applied !== null && hasActiveCriteria(applied)) || activeCategory !== null || onlySaved

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
    setActiveCategory(null)
    setOnlySaved(false)
    setFormKey((value) => value + 1)
  }

  /** Desde la sección «Destinos»: filtra el catálogo y lleva a los resultados. */
  function exploreDestination(name: string) {
    setApplied({ ...(applied ?? emptyCriteria), destination: name })
    setActiveCategory(null)
    setOnlySaved(false)
    setFormKey((value) => value + 1)
    document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const es = language === 'ES'

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <WelcomeModal />
      {/* Capa 40 — ver la escala documentada en app/globals.css */}
      <header className="absolute inset-x-0 top-0 z-40 border-b border-white/20 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="#inicio" className="flex items-center gap-2.5" aria-label="Experiences El Salvador · Inicio">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4b942] text-[#173f45]"><Compass size={21} strokeWidth={2.5} /></span>
            <span className="text-lg font-bold tracking-tight">Experiences <span className="text-[#f4b942]">El Salvador</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label={es ? 'Navegación principal' : 'Main navigation'}>
            <a href="#experiencias" className="transition hover:text-[#f4b942]">{es ? 'Explorar' : 'Explore'}</a>
            <a href="#destinos" className="transition hover:text-[#f4b942]">{es ? 'Destinos' : 'Destinations'}</a>
            <a href="#opiniones" className="transition hover:text-[#f4b942]">{es ? 'Opiniones' : 'Reviews'}</a>
            <a href="#como-funciona" className="transition hover:text-[#f4b942]">{es ? 'Cómo funciona' : 'How it works'}</a>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <LanguageSwitch lang={language} onChange={setLang} />
            <SessionNav />
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? (es ? 'Cerrar menú' : 'Close menu') : (es ? 'Abrir menú' : 'Open menu')}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/20 bg-[#173f45] px-5 pb-5 pt-3 md:hidden">
            <nav className="flex flex-col gap-4 text-sm">
              <a href="#experiencias" onClick={() => setMenuOpen(false)}>{es ? 'Explorar' : 'Explore'}</a>
              <a href="#destinos" onClick={() => setMenuOpen(false)}>{es ? 'Destinos' : 'Destinations'}</a>
              <a href="#opiniones" onClick={() => setMenuOpen(false)}>{es ? 'Opiniones' : 'Reviews'}</a>
              <a href="#como-funciona" onClick={() => setMenuOpen(false)}>{es ? 'Cómo funciona' : 'How it works'}</a>
            </nav>
            {/*
              Idioma y sesión también en móvil: antes el acceso a la cuenta
              solo existía en escritorio.
            */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-4">
              <LanguageSwitch lang={language} onChange={setLang} />
              <SessionNav />
            </div>
          </div>
        )}
      </header>

      {/*
        Sin `overflow-hidden`: recortaba los desplegables del destino y del
        calendario al salirse del héroe. La imagen y los degradados están en
        `absolute inset-0`, así que no se desbordan por sí solos.
      */}
      <section id="inicio" className="relative flex min-h-[620px] items-center bg-[#174b51] pt-24">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,48,.86)_0%,rgba(10,43,48,.55)_45%,rgba(10,43,48,.15)_100%)]" />
        {/*
          Imagen del LCP: prioridad alta y tamaños por ancho de pantalla.
          Cerro Verde y el volcán de Izalco (créditos en lib/credits.ts). El
          Izalco está a la derecha de la foto: en móvil, donde el recorte
          vertical es fuerte, se desplaza el encuadre para que no quede fuera.
        */}
        <img
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,55,61,.35),rgba(12,55,61,.1)_45%,rgba(251,250,247,.9)_100%)]" />
        {/*
          Capa 30. Este div crea el contexto de apilamiento donde viven los
          desplegables del buscador, así que su z decide si el buscador queda
          por encima de la tira de categorías (capa 20) o por debajo.
        */}
        <div className="relative z-30 mx-auto w-full max-w-7xl px-5 pb-28 pt-16 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[.22em] text-[#f4d27c]"><span className="h-px w-8 bg-[#f4d27c]" />{es ? 'Viaja con propósito' : 'Travel with purpose'}</p>
            <h1 className="text-5xl font-semibold leading-[.98] tracking-[-.04em] md:text-7xl">El Salvador, <em className="font-serif font-normal text-[#f4c45e]">{es ? 'a tu manera.' : 'your way.'}</em></h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">{es ? 'Descubre lugares que se sienten como un secreto. Experiencias locales, recuerdos que se quedan.' : 'Discover places that feel like a secret. Local experiences, memories that stay.'}</p>
          </div>

          <SearchPanel key={formKey} applied={applied} onSearch={setApplied} lang={language} />

          {applied && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white">
              <span>
                {results.length}{' '}
                {es
                  ? results.length === 1 ? 'experiencia encontrada' : 'experiencias encontradas'
                  : results.length === 1 ? 'experience found' : 'experiences found'}
              </span>
              <a href="#experiencias" className="font-bold text-[#f4c45e] underline underline-offset-4">
                {es ? 'Ver resultados' : 'See results'}
              </a>
            </p>
          )}
        </div>
      </section>

      {/*
        Capa 20: por encima del degradado del héroe, gracias al -mt-3 que la
        solapa, pero por debajo del buscador (capa 30).
      */}
      {/*
        pt-2 / -mt-5: el contenedor con scroll horizontal recorta también en
        vertical, y cortaba el anillo de la categoría activa y el salto del
        hover. El margen compensa para que la tira quede donde estaba.
      */}
      <section className="relative z-20 mx-auto -mt-5 max-w-7xl px-5 lg:px-8"><div className="flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:none]">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.icon]
          const isActive = activeCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(isActive ? null : category.id)}
              aria-pressed={isActive}
              className={`group relative h-24 min-w-40 shrink-0 overflow-hidden rounded-2xl text-left shadow-lg transition hover:-translate-y-1 ${isActive ? 'ring-2 ring-[#f4b942] ring-offset-2' : ''}`}
            >
              <img src={category.image} alt="" width={320} height={192} decoding="async" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
              <span className="absolute inset-0 bg-[#103f44]/55" />
              <span className="relative flex h-full flex-col justify-between p-4 text-white"><Icon size={20} /><span className="font-semibold">{category.label[language]}</span></span>
            </button>
          )
        })}
      </div></section>

      {/* Reels: justo debajo del héroe y sus categorías, antes del catálogo. */}
      <ReelsSection />

      <section id="experiencias" className="mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">{es ? 'Para empezar' : 'To get started'}</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {es ? <>Experiencias que <em className="font-serif font-normal">dejan huella</em></> : <>Experiences that <em className="font-serif font-normal">leave a mark</em></>}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden text-sm text-[#6a8588] sm:block" aria-live="polite">
              {results.length} {es ? (results.length === 1 ? 'experiencia' : 'experiencias') : results.length === 1 ? 'experience' : 'experiences'}
            </p>
            {favorites.length > 0 && (
              <button
                onClick={() => setOnlySaved((value) => !value)}
                aria-pressed={onlySaved}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition ${onlySaved ? 'border-[#b8481c] bg-[#b8481c] text-white' : 'border-[#dce7e1] text-[#173f45] hover:bg-[#eaf1ed]'}`}
              >
                <Heart size={14} fill={onlySaved ? '#fff' : 'none'} />
                {es ? 'Guardadas' : 'Saved'} ({favorites.length})
              </button>
            )}
          </div>
        </div>

        {isFiltered && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {applied?.destination && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#eaf1ed] px-3 py-1.5 text-xs font-semibold text-[#173f45]"><MapPin size={13} />{applied.destination}</span>
            )}
            {applied?.date && (
              <span className="rounded-full bg-[#eaf1ed] px-3 py-1.5 text-xs font-semibold text-[#173f45]">{formatDate(applied.date, language)}</span>
            )}
            {applied && applied.people !== emptyCriteria.people && (
              <span className="rounded-full bg-[#eaf1ed] px-3 py-1.5 text-xs font-semibold text-[#173f45]">
                {applied.people} {es ? (applied.people === 1 ? 'viajero' : 'viajeros') : applied.people === 1 ? 'traveler' : 'travelers'}
              </span>
            )}
            {activeCategory && (
              <span className="rounded-full bg-[#f4d27c] px-3 py-1.5 text-xs font-bold text-[#173f45]">
                {categories.find((category) => category.id === activeCategory)?.label[language]}
              </span>
            )}
            {onlySaved && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#fbe3d7] px-3 py-1.5 text-xs font-bold text-[#963b18]">
                <Heart size={12} fill="currentColor" />
                {es ? 'Solo guardadas' : 'Saved only'}
              </span>
            )}
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-full border border-[#dce7e1] px-3 py-1.5 text-xs font-bold text-[#173f45] transition hover:bg-[#eaf1ed]"
            >
              <RotateCcw size={13} />
              {es ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{results.map((item) => {
          const saved = favorites.includes(item.id)
          const name = experienceName(item, language)
          const next = now ? nextDepartures(item.weekdays, 1, now)[0] : undefined
          const detailHref = `/experiences/${item.id}`
          // Si el visitante ya buscó, el checkout llega con su fecha y viajeros.
          const bookQuery = new URLSearchParams()
          if (applied?.date) bookQuery.set('date', applied.date)
          if (applied && applied.people !== emptyCriteria.people) bookQuery.set('people', String(applied.people))
          const query = bookQuery.toString()
          const bookHref = `/checkout/${item.id}${query ? `?${query}` : ''}`
          return (
            <article key={item.id} className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.08)]">
              <div className="relative h-56 overflow-hidden">
                <a href={detailHref} tabIndex={-1} aria-hidden="true" className="block h-full"><img src={item.image} alt={item.imageAlt[language]} loading="lazy" decoding="async" width={600} height={448} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></a>
                {item.tag && <span className="absolute left-3 top-3 rounded-full bg-[#f4d27c] px-3 py-1 text-[11px] font-bold text-[#173f45]">{item.tag[language]}</span>}
                <button
                  onClick={() => toggleFavorite(item.id)}
                  aria-pressed={saved}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#173f45] transition hover:scale-105"
                  aria-label={`${es ? 'Guardar' : 'Save'} ${name}`}
                >
                  <Heart size={17} fill={saved ? '#b8481c' : 'none'} className={saved ? 'text-[#b8481c]' : ''} />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-[#6a8588]">
                  <span className="flex items-center gap-1"><MapPin size={13} />{item.destination}</span>
                  <RatingBadge rating={stats?.[item.id]} loading={stats === undefined} lang={language} />
                </div>
                <h3 className="text-lg font-semibold leading-snug"><a href={detailHref} className="transition hover:text-[#b8481c]">{name}</a></h3>
                <p className="mt-2 text-xs text-[#6a8588]">{item.durationHours} {es ? 'horas · Guía local incluido' : 'hours · Local guide included'}</p>
                {/* Lo que más pesa al decidir: poder cancelar y cuándo sale. */}
                <ul className="mt-3 grid gap-1 text-xs">
                  <li className="flex items-center gap-1.5 font-semibold text-[#2f7d63]">
                    <ShieldCheck size={13} aria-hidden="true" />
                    {es ? `Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`}
                  </li>
                  <li className="flex min-h-4 items-center gap-1.5 text-[#547176]">
                    <CalendarCheck size={13} aria-hidden="true" />
                    {next ? (
                      <span>{es ? 'Próxima salida: ' : 'Next departure: '}<strong className="font-semibold text-[#173f45]">{departureLabel(next, language, now ?? undefined)}</strong></span>
                    ) : (
                      <span className="h-3 w-24 animate-pulse rounded-full bg-[#eaf1ed]" aria-hidden="true" />
                    )}
                  </li>
                </ul>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-[#edf0ed] pt-3">
                  <span><span className="text-xs text-[#6a8588]">{es ? 'Desde' : 'From'}</span> <strong className="text-lg">${item.priceUsd}</strong> <span className="text-xs text-[#6a8588]">{es ? '/ persona' : '/ person'}</span></span>
                  <a href={bookHref} className="rounded-full bg-[#b8481c] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45]">{es ? 'Reservar' : 'Book Now'}</a>
                </div>
              </div>
            </article>
          )
        })}</div>

        {results.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-[0_8px_30px_rgba(26,65,69,.08)]">
            <p className="text-lg font-semibold text-[#173f45]">
              {es ? 'No encontramos experiencias con estos criterios.' : 'No experiences match these filters.'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6a8588]">
              {es ? 'Prueba cambiando el destino o las fechas.' : 'Try changing the destination or the dates.'}
            </p>
            <button
              onClick={resetAll}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#963b18]"
            >
              <RotateCcw size={16} />
              {es ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          </div>
        )}
      </section>

      <ReviewsSection />

      <section id="como-funciona" className="bg-[#eaf1ed] py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">{es ? 'Viajar es fácil' : 'Travel made easy'}</p><h2 className="max-w-md text-3xl font-semibold tracking-tight md:text-4xl">{es ? <>Lo local se vive <em className="font-serif font-normal">mejor.</em></> : <>Local is simply <em className="font-serif font-normal">better.</em></>}</h2><p className="mt-5 max-w-md leading-relaxed text-[#547176]">{es ? 'Conectamos tus ganas de explorar con quienes conocen cada rincón de El Salvador. Tú eliges el plan, nosotros cuidamos los detalles.' : 'We connect your urge to explore with the people who know every corner of El Salvador. You pick the plan, we handle the details.'}</p><a href="#experiencias" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#173f45] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0e3035]">{es ? 'Elegir mi experiencia' : 'Choose my experience'} <ArrowRight size={17} /></a></div><div className="grid gap-4 sm:grid-cols-3">{(es ? [['01','Elige','Encuentra el destino o experiencia que te mueve.'],['02','Reserva','Confirma en pocos pasos y recibe todo al instante.'],['03','Disfruta','Vive el momento con anfitriones locales.']] : [['01','Choose','Find the destination or experience that moves you.'],['02','Book','Confirm in a few steps and get everything instantly.'],['03','Enjoy','Live the moment with local hosts.']]).map(([number, title, description]) => <div key={number} className="rounded-2xl bg-white p-5"><span className="text-4xl font-light text-[#f0b649]">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#6a8588]">{description}</p><Check className="mt-5 text-[#b8481c]" size={19} /></div>)}</div></div></div></section>

      <section id="destinos" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="rounded-[2rem] bg-[#173f45] p-7 text-white md:p-12">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#f4d27c]">{es ? 'Destinos' : 'Destinations'}</p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
              {es ? <>Elige a dónde <em className="font-serif font-normal text-[#f4c45e]">ir primero.</em></> : <>Choose where to <em className="font-serif font-normal text-[#f4c45e]">go first.</em></>}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75">
              {es ? 'Toca un destino y te mostramos todas sus experiencias.' : 'Tap a destination to see all of its experiences.'}
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {DESTINATION_TILES.map((tile) => (
              <li key={tile.name}>
                <button
                  onClick={() => exploreDestination(tile.name)}
                  className="group relative block h-40 w-full overflow-hidden rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4b942]"
                >
                  <img src={tile.image} alt={tile.alt[language]} loading="lazy" decoding="async" width={320} height={240} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3">
                    <span className="block font-semibold leading-tight">{tile.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                      {tile.count} {es ? (tile.count === 1 ? 'experiencia' : 'experiencias') : tile.count === 1 ? 'experience' : 'experiences'}
                      <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
