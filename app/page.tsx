'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Heart,
  MapPin,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
  X,
} from 'lucide-react'
import { SearchPanel } from '@/components/search/search-panel'
import {
  categories,
  emptyCriteria,
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
  const [language, setLanguage] = useState<Locale>('ES')
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

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
    () => filterExperiences(criteria, activeCategory),
    [criteria, activeCategory],
  )

  const isFiltered = (applied !== null && hasActiveCriteria(applied)) || activeCategory !== null

  function resetAll() {
    setApplied(null)
    setActiveCategory(null)
    setFormKey((value) => value + 1)
  }

  const es = language === 'ES'

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/20 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="#inicio" className="flex items-center gap-2.5" aria-label="Experience El Salvador · Inicio">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4b942] text-[#173f45]"><Compass size={21} strokeWidth={2.5} /></span>
            <span className="text-lg font-bold tracking-tight">Experience <span className="text-[#f4b942]">El Salvador</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Navegación principal">
            <a href="#experiencias" className="transition hover:text-[#f4b942]">{es ? 'Explorar' : 'Explore'}</a>
            <a href="#destinos" className="transition hover:text-[#f4b942]">{es ? 'Destinos' : 'Destinations'}</a>
            <a href="#como-funciona" className="transition hover:text-[#f4b942]">{es ? 'Cómo funciona' : 'How it works'}</a>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <button onClick={() => setLanguage(es ? 'EN' : 'ES')} className="flex items-center gap-1 text-sm font-semibold" aria-label="Cambiar idioma">{language}<ChevronDown size={15} /></button>
            <button className="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#173f45]">{es ? 'Iniciar sesión' : 'Sign in'}</button>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="border-t border-white/20 bg-[#173f45] px-5 pb-5 pt-3 md:hidden"><nav className="flex flex-col gap-4 text-sm"><a href="#experiencias" onClick={() => setMenuOpen(false)}>{es ? 'Explorar' : 'Explore'}</a><a href="#destinos" onClick={() => setMenuOpen(false)}>{es ? 'Destinos' : 'Destinations'}</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>{es ? 'Cómo funciona' : 'How it works'}</a></nav></div>}
      </header>

      {/*
        Sin `overflow-hidden`: recortaba los desplegables del destino y del
        calendario al salirse del héroe. La imagen y los degradados están en
        `absolute inset-0`, así que no se desbordan por sí solos.
      */}
      <section id="inicio" className="relative flex min-h-[620px] items-center bg-[#174b51] pt-24">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,48,.86)_0%,rgba(10,43,48,.55)_45%,rgba(10,43,48,.15)_100%)]" />
        <img src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90" alt="Playa tropical de El Salvador al atardecer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,55,61,.35),rgba(12,55,61,.1)_45%,rgba(251,250,247,.9)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-28 pt-16 lg:px-8">
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

      <section className="relative z-10 mx-auto -mt-3 max-w-7xl px-5 lg:px-8"><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
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
              <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
              <span className="absolute inset-0 bg-[#103f44]/55" />
              <span className="relative flex h-full flex-col justify-between p-4 text-white"><Icon size={20} /><span className="font-semibold">{category.label[language]}</span></span>
            </button>
          )
        })}
      </div></section>

      <section id="experiencias" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">{es ? 'Para empezar' : 'To get started'}</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {es ? <>Experiencias que <em className="font-serif font-normal">dejan huella</em></> : <>Experiences that <em className="font-serif font-normal">leave a mark</em></>}
            </h2>
          </div>
          <a href="#destinos" className="hidden items-center gap-2 text-sm font-bold text-[#b8481c] sm:flex">{es ? 'Ver todas' : 'See all'} <ArrowRight size={17} /></a>
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
          return (
            <article key={item.id} className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.08)]">
              <div className="relative h-56 overflow-hidden">
                <img src={item.image} alt={item.imageAlt[language]} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                {item.tag && <span className="absolute left-3 top-3 rounded-full bg-[#f4d27c] px-3 py-1 text-[11px] font-bold text-[#173f45]">{item.tag[language]}</span>}
                <button
                  onClick={() => setFavorites((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                  aria-pressed={saved}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#173f45]"
                  aria-label={`${es ? 'Guardar' : 'Save'} ${item.title}`}
                >
                  <Heart size={17} fill={saved ? '#b8481c' : 'none'} className={saved ? 'text-[#b8481c]' : ''} />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-[#6a8588]">
                  <span className="flex items-center gap-1"><MapPin size={13} />{item.destination}</span>
                  <span className="flex items-center gap-1 font-semibold text-[#173f45]"><Star size={13} fill="#f4b942" className="text-[#f4b942]" />{item.rating.toFixed(1)} ({item.reviews})</span>
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-xs text-[#6a8588]">{item.durationHours} {es ? 'horas · Guía local incluido' : 'hours · Local guide included'}</p>
                <div className="mt-4 flex items-end justify-between border-t border-[#edf0ed] pt-3">
                  <span><span className="text-xs text-[#6a8588]">{es ? 'Desde' : 'From'}</span> <strong className="text-lg">${item.priceUsd}</strong> <span className="text-xs text-[#6a8588]">{es ? '/ persona' : '/ person'}</span></span>
                  <button className="text-xs font-bold text-[#b8481c]">{es ? 'Ver más' : 'See more'}</button>
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

      <section id="como-funciona" className="bg-[#eaf1ed] py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">{es ? 'Viajar es fácil' : 'Travel made easy'}</p><h2 className="max-w-md text-3xl font-semibold tracking-tight md:text-4xl">{es ? <>Lo local se vive <em className="font-serif font-normal">mejor.</em></> : <>Local is simply <em className="font-serif font-normal">better.</em></>}</h2><p className="mt-5 max-w-md leading-relaxed text-[#547176]">{es ? 'Conectamos tus ganas de explorar con quienes conocen cada rincón de El Salvador. Tú eliges el plan, nosotros cuidamos los detalles.' : 'We connect your urge to explore with the people who know every corner of El Salvador. You pick the plan, we handle the details.'}</p><button className="mt-7 flex items-center gap-2 rounded-full bg-[#173f45] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0e3035]">{es ? 'Conoce cómo funciona' : 'See how it works'} <ArrowRight size={17} /></button></div><div className="grid gap-4 sm:grid-cols-3">{(es ? [['01','Elige','Encuentra el destino o experiencia que te mueve.'],['02','Reserva','Confirma en pocos pasos y recibe todo al instante.'],['03','Disfruta','Vive el momento con anfitriones locales.']] : [['01','Choose','Find the destination or experience that moves you.'],['02','Book','Confirm in a few steps and get everything instantly.'],['03','Enjoy','Live the moment with local hosts.']]).map(([number, title, description]) => <div key={number} className="rounded-2xl bg-white p-5"><span className="text-4xl font-light text-[#f0b649]">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#6a8588]">{description}</p><Check className="mt-5 text-[#b8481c]" size={19} /></div>)}</div></div></div></section>

      <section id="destinos" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="rounded-[2rem] bg-[#173f45] p-7 text-white md:p-12"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#f4d27c]">{es ? 'Tu próxima historia' : 'Your next story'}</p><h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">{es ? <>Hay mucho más por <em className="font-serif font-normal text-[#f4c45e]">descubrir.</em></> : <>There is much more to <em className="font-serif font-normal text-[#f4c45e]">discover.</em></>}</h2></div><a href="#experiencias" className="flex shrink-0 items-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#963b18]">{es ? 'Explorar destinos' : 'Explore destinations'} <ArrowRight size={17} /></a></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="relative h-48 overflow-hidden rounded-2xl sm:col-span-2"><img src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1000&q=85" alt="Paisaje montañoso de El Salvador" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-4 left-4 font-semibold">Ruta de las Flores</span></div><div className="relative h-48 overflow-hidden rounded-2xl"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85" alt="Paisaje natural salvadoreño" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-4 left-4 font-semibold">Suchitoto</span></div></div></div></section>

      <footer className="border-t border-[#dce7e1] px-5 py-8 text-sm text-[#6a8588]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row"><span className="font-bold text-[#173f45]">Experience <span className="text-[#b8481c]">El Salvador</span></span><span>{es ? 'Hecho con cariño desde El Salvador · © 2026' : 'Made with care in El Salvador · © 2026'}</span><span>{es ? 'Español · Términos · Privacidad' : 'English · Terms · Privacy'}</span></div></footer>
    </main>
  )
}
