'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Backpack,
  Baby,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Gauge,
  Heart,
  Languages,
  MapPin,
  QrCode,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { RatingBadge } from '@/components/reviews/rating-badge'
import { ExperienceReviews } from '@/components/reviews/experience-reviews'
import { useReviewStats } from '@/components/reviews/use-review-stats'
import { useFavorites } from '@/components/favorites/use-favorites'
import { destinationIdByName } from '@/lib/destination-details'
import { experienceName, type Experience, type Locale } from '@/lib/data'
import { trackViewItem } from '@/lib/analytics'
import { departureLabel, formatDeparture, nextDepartures } from '@/lib/departures'
import {
  DIFFICULTY_LABEL,
  FREE_CANCELLATION_HOURS,
  mapEmbedUrl,
  mapLinkUrl,
  type ExperienceDetails,
} from '@/lib/experience-details'

const WEEKDAYS = {
  ES: ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'],
  EN: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'],
}

const LANGUAGE_NAME: Record<Locale, Record<Locale, string>> = {
  ES: { ES: 'Español', EN: 'Spanish' },
  EN: { ES: 'Inglés', EN: 'English' },
}

function scheduleLabel(weekdays: number[], es: boolean): string {
  if (weekdays.length === 7) return es ? 'Todos los días' : 'Every day'
  // Lunes primero, domingo al final.
  const ordered = [...weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const names = ordered.map((day) => WEEKDAYS[es ? 'ES' : 'EN'][day])
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} ${es ? 'y' : 'and'} ${names[names.length - 1]}`
}

/** Métodos de pago activos, decididos en el servidor. */
export type PaymentBadges = { card: boolean; paypal: boolean }

export function ExperienceDetail({
  experience,
  details,
  related,
  payments,
}: {
  experience: Experience
  details: ExperienceDetails | null
  related: Experience[]
  payments: PaymentBadges
}) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const name = experienceName(experience, lang)
  const stats = useReviewStats()
  const rating = stats?.[experience.id]
  const { ids: favorites, toggle: toggleFavorite } = useFavorites()
  const saved = favorites.includes(experience.id)
  const destinationId = destinationIdByName(experience.destination)

  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({ lang, experience: experience.title, destination: experience.destination, date: null, people: null })
  }, [lang, experience.title, experience.destination, setLead])

  // Analítica: una vista por experiencia (no se repite al cambiar de idioma).
  useEffect(() => {
    trackViewItem({ id: experience.id, name: experience.title, priceUsd: experience.priceUsd, destination: experience.destination })
  }, [experience.id, experience.title, experience.priceUsd, experience.destination])

  // Fechas calculadas solo en el navegador (ver la nota en app/page.tsx).
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const departures = now ? nextDepartures(experience.weekdays, 4, now) : []

  const bookHref = `/checkout/${experience.id}`
  const schedule = scheduleLabel(experience.weekdays, es)

  const images = [
    { src: experience.image, alt: experience.imageAlt },
    ...(details?.gallery ?? []),
  ]

  const facts = [
    { icon: Clock, label: es ? 'Duración' : 'Duration', value: `${experience.durationHours} ${es ? 'horas' : 'hours'}` },
    { icon: Users, label: es ? 'Grupo' : 'Group size', value: `${es ? 'Hasta' : 'Up to'} ${experience.maxPeople}` },
    { icon: CalendarDays, label: es ? 'Salidas' : 'Departures', value: schedule },
    ...(details
      ? [
          { icon: Gauge, label: es ? 'Dificultad' : 'Difficulty', value: DIFFICULTY_LABEL[details.difficulty][lang] },
          {
            icon: Languages,
            label: es ? 'Idiomas del guía' : 'Guide languages',
            value: details.languages.map((code) => LANGUAGE_NAME[code][lang]).join(' · '),
          },
          {
            icon: Baby,
            label: es ? 'Edad mínima' : 'Minimum age',
            value: details.minAge > 0 ? `${details.minAge} ${es ? 'años' : 'years'}` : es ? 'Todas las edades' : 'All ages',
          },
        ]
      : []),
  ]

  const paymentText = [payments.card && (es ? 'tarjeta' : 'card'), payments.paypal && 'PayPal']
    .filter(Boolean)
    .join(es ? ' o ' : ' or ')

  /*
   * Barra fija de reserva en móvil. Aparece cuando la tarjeta de precio sale
   * de la pantalla, para que «Reservar» esté siempre a un toque, como en
   * GetYourGuide o Airbnb. Mientras está visible, sube el botón de WhatsApp
   * con --sticky-offset para que no la tape.
   */
  const bookingCardRef = useRef<HTMLDivElement>(null)
  const [showBar, setShowBar] = useState(false)
  useEffect(() => {
    const card = bookingCardRef.current
    if (!card || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting))
    observer.observe(card)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const root = document.documentElement
    // La barra solo existe por debajo de lg (1024 px).
    const narrow = window.matchMedia('(max-width: 1023px)').matches
    root.style.setProperty('--sticky-offset', showBar && narrow ? '4.75rem' : '0px')
    return () => {
      root.style.removeProperty('--sticky-offset')
    }
  }, [showBar])

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-6 lg:px-8 lg:pt-8">
        <nav aria-label={es ? 'Ruta de navegación' : 'Breadcrumb'} className="mb-5 flex flex-wrap items-center gap-1 text-xs text-[#6a8588]">
          <Link href="/" className="hover:text-[#173f45] hover:underline">{es ? 'Inicio' : 'Home'}</Link>
          <ChevronRight size={12} />
          <Link href="/#experiencias" className="hover:text-[#173f45] hover:underline">{es ? 'Experiencias' : 'Experiences'}</Link>
          <ChevronRight size={12} />
          <span aria-current="page" className="font-semibold text-[#173f45]">{name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <Gallery images={images} tag={experience.tag?.[lang]} lang={lang} />

          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
              {destinationId ? (
                <Link href={`/destinos/${destinationId}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#6a8588] hover:text-[#b8481c] hover:underline">
                  <MapPin size={15} /> {experience.destination}
                </Link>
              ) : (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[#6a8588]">
                  <MapPin size={15} /> {experience.destination}
                </p>
              )}
              <button
                onClick={() => toggleFavorite(experience.id)}
                aria-pressed={saved}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${saved ? 'border-[#b8481c] bg-[#fdf3ee] text-[#b8481c]' : 'border-[#dce7e1] bg-white text-[#173f45] hover:bg-[#eaf1ed]'}`}
              >
                <Heart size={14} fill={saved ? '#b8481c' : 'none'} />
                {saved ? (es ? 'Guardada' : 'Saved') : es ? 'Guardar' : 'Save'}
              </button>
            </div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{name}</h1>
            <a href="#opiniones-experiencia" className="mt-2 inline-flex w-fit hover:underline">
              <RatingBadge rating={rating} loading={stats === undefined} lang={lang} size="md" />
            </a>

            <p className="mt-5 leading-relaxed text-[#547176]">{experience.description[lang]}</p>

            <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <li className="flex items-center gap-1.5 rounded-full bg-[#e3f1ea] px-3 py-1.5 text-[#256b54]">
                <ShieldCheck size={14} aria-hidden="true" />
                {es ? `Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-[#eaf1ed] px-3 py-1.5 text-[#173f45]">
                <Zap size={14} aria-hidden="true" />
                {es ? 'Confirmación inmediata' : 'Instant confirmation'}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-[#eaf1ed] px-3 py-1.5 text-[#173f45]">
                <QrCode size={14} aria-hidden="true" />
                {es ? 'Entrada digital con QR' : 'Digital QR ticket'}
              </li>
            </ul>

            <div ref={bookingCardRef} id="reservar" className="mt-6 scroll-mt-24 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(26,65,69,.08)]">
              <p>
                <span className="text-xs text-[#6a8588]">{es ? 'Desde' : 'From'}</span>{' '}
                <strong className="text-3xl">${experience.priceUsd}</strong>{' '}
                <span className="text-sm text-[#6a8588]">{es ? '/ persona · USD, precio final' : '/ person · USD, final price'}</span>
              </p>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#759096]">
                {es ? 'Próximas salidas' : 'Next departures'}
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {(departures.length > 0 ? departures : [null, null, null, null]).map((iso, index) => (
                  <li key={iso ?? index}>
                    {iso ? (
                      <Link
                        href={`${bookHref}?date=${iso}`}
                        className="flex h-full flex-col rounded-xl border border-[#dce7e1] px-3 py-2 text-sm transition hover:border-[#b8481c] hover:bg-[#fdf3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45]"
                      >
                        <span className="font-semibold capitalize">{formatDeparture(iso, lang)}</span>
                        {index === 0 && now && departureLabel(iso, lang, now) !== formatDeparture(iso, lang) && (
                          <span className="text-[11px] font-semibold text-[#b8481c]">{departureLabel(iso, lang, now)}</span>
                        )}
                      </Link>
                    ) : (
                      <span className="block h-10 animate-pulse rounded-xl bg-[#eaf1ed]" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ul>

              <Link
                href={bookHref}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#b8481c] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45]"
              >
                {es ? 'Ver todas las fechas y reservar' : 'See all dates and book'} <ArrowRight size={16} />
              </Link>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-[#6a8588]">
                <ShieldCheck size={14} className="mt-px shrink-0 text-[#256b54]" />
                {es
                  ? `Sin crear cuenta · Pago seguro${paymentText ? ` con ${paymentText}` : ''} · Ayuda por WhatsApp`
                  : `No account needed · Secure payment${paymentText ? ` by ${paymentText}` : ''} · WhatsApp support`}
              </p>
            </div>
          </div>
        </div>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl border border-[#dce7e1] bg-white p-3.5">
              <Icon size={18} className="mt-0.5 shrink-0 text-[#b8481c]" />
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-[#759096]">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid content-start gap-12">
            {details && (
              <section aria-labelledby="itinerary-title">
                <h2 id="itinerary-title" className="text-xl font-semibold">{es ? 'Itinerario' : 'Itinerary'}</h2>
                <ol className="mt-5 grid">
                  {details.itinerary.map((step, index) => {
                    const last = index === details.itinerary.length - 1
                    return (
                      <li key={step.time} className="relative flex gap-4 pb-5 last:pb-0">
                        {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-[#dce7e1]" aria-hidden="true" />}
                        <span className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] bg-white ${index === 0 || last ? 'border-[#b8481c]' : 'border-[#dce7e1]'}`} aria-hidden="true" />
                        <div>
                          <p className="text-xs font-bold text-[#b8481c]">{step.time}</p>
                          <p className="mt-0.5 text-sm text-[#173f45]">{step.text[lang]}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
                <p className="mt-4 text-xs text-[#6a8588]">
                  {es ? 'Horarios aproximados: el guía puede ajustarlos según el clima y el ritmo del grupo.' : 'Approximate times: your guide may adjust them for weather and group pace.'}
                </p>
              </section>
            )}

            <section aria-labelledby="highlights-title">
              <h2 id="highlights-title" className="text-xl font-semibold">{es ? 'Lo mejor' : 'Highlights'}</h2>
              <ul className="mt-4 grid gap-2.5">
                {experience.highlights[lang].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#547176]">
                    <Check size={17} className="mt-0.5 shrink-0 text-[#b8481c]" /> {item}
                  </li>
                ))}
              </ul>
            </section>

            {details && (
              <section aria-labelledby="includes-title" className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 id="includes-title" className="text-xl font-semibold">{es ? 'Incluye' : 'Included'}</h2>
                  <ul className="mt-4 grid gap-2.5">
                    {details.includes[lang].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-[#547176]">
                        <Check size={17} className="mt-0.5 shrink-0 text-[#2f7d63]" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{es ? 'No incluye' : 'Not included'}</h2>
                  <ul className="mt-4 grid gap-2.5">
                    {details.excludes[lang].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-[#547176]">
                        <X size={17} className="mt-0.5 shrink-0 text-[#a3341c]" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {details && (
              <section aria-labelledby="bring-title">
                <h2 id="bring-title" className="flex items-center gap-2 text-xl font-semibold">
                  <Backpack size={20} className="text-[#b8481c]" /> {es ? 'Qué llevar' : 'What to bring'}
                </h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {details.bring[lang].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#547176]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b8481c]" aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
                {details.notes && (
                  <div className="mt-5 grid gap-2 rounded-2xl border border-[#f1d9a6] bg-[#fdf6e7] p-4">
                    {details.notes[lang].map((note) => (
                      <p key={note} className="flex items-start gap-2 text-sm text-[#6b4a0c]">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {note}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="grid content-start gap-12">
            {details && (
              <section aria-labelledby="meeting-title">
                <h2 id="meeting-title" className="text-xl font-semibold">{es ? 'Punto de encuentro' : 'Meeting point'}</h2>
                <p className="mt-3 flex items-start gap-2 text-sm font-semibold">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-[#b8481c]" /> {details.meetingPoint.name[lang]}
                </p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#eaf1ed]">
                  <iframe
                    title={`${es ? 'Mapa' : 'Map'}: ${details.meetingPoint.name[lang]}`}
                    src={mapEmbedUrl(details.meetingPoint.mapQuery, lang)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-64 w-full border-0"
                  />
                </div>
                <a
                  href={mapLinkUrl(details.meetingPoint.mapQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#b8481c] underline-offset-4 hover:underline"
                >
                  {es ? 'Abrir en Google Maps' : 'Open in Google Maps'} <ExternalLink size={14} />
                </a>
                <p className="mt-2 text-xs text-[#6a8588]">
                  {es ? '¿Dudas sobre cómo llegar? Escríbenos por WhatsApp y te ayudamos.' : 'Not sure how to get there? Message us on WhatsApp and we will help.'}
                </p>
              </section>
            )}

            <section aria-labelledby="cancellation-title" className="rounded-2xl bg-[#eaf1ed] p-5">
              <h2 id="cancellation-title" className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck size={20} className="text-[#256b54]" /> {es ? 'Política de cancelación' : 'Cancellation policy'}
              </h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#2f7d63]" />
                  <span><strong>{es ? `Más de ${FREE_CANCELLATION_HOURS} h antes:` : `More than ${FREE_CANCELLATION_HOURS} h before:`}</strong> {es ? 'reembolso completo.' : 'full refund.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CalendarCheck size={16} className="mt-0.5 shrink-0 text-[#8a5d0c]" />
                  <span><strong>{es ? 'Entre 48 y 24 h antes:' : 'Between 48 and 24 h before:'}</strong> {es ? 'reembolso del 50 %.' : '50% refund.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="mt-0.5 shrink-0 text-[#a3341c]" />
                  <span><strong>{es ? 'Menos de 24 h o no presentarse:' : 'Less than 24 h or no-show:'}</strong> {es ? 'sin reembolso.' : 'no refund.'}</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-[#547176]">
                {es ? 'Si cancelamos por clima o seguridad, eliges otra fecha o el reembolso completo.' : 'If we cancel for weather or safety, you choose another date or a full refund.'}{' '}
                <Link href="/legal/cancellation" className="font-bold text-[#b8481c] underline-offset-4 hover:underline">
                  {es ? 'Ver política completa' : 'Full policy'}
                </Link>
              </p>
            </section>

            <section aria-labelledby="how-title">
              <h2 id="how-title" className="text-xl font-semibold">{es ? 'Cómo funciona' : 'How it works'}</h2>
              <ol className="mt-4 grid gap-2.5 text-sm text-[#547176]">
                {(es
                  ? ['Elige fecha y número de viajeros.', 'Deja tus datos de contacto: no hace falta cuenta.', `Paga en la página segura${paymentText ? ` (${paymentText})` : ''}.`, 'Recibe tu confirmación y una entrada con QR por viajero.']
                  : ['Pick a date and the number of travelers.', 'Leave your contact details — no account needed.', `Pay on the secure page${paymentText ? ` (${paymentText})` : ''}.`, 'Get your confirmation and one QR ticket per traveler.']
                ).map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf1ed] text-xs font-bold text-[#173f45]">{index + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <ExperienceReviews experienceId={experience.id} rating={rating} lang={lang} />

        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related">
            <h2 id="related" className="text-xl font-semibold">{es ? 'También te puede gustar' : 'You may also like'}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/experiences/${item.id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.08)]"
                >
                  <div className="h-44 overflow-hidden">
                    <Picture src={item.image} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" alt={item.imageAlt[lang]} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6a8588]">
                      <span className="flex items-center gap-1"><MapPin size={13} />{item.destination}</span>
                      <RatingBadge rating={stats?.[item.id]} loading={stats === undefined} lang={lang} />
                    </div>
                    <p className="mt-1 font-semibold">{experienceName(item, lang)}</p>
                    <p className="mt-2 text-sm"><strong>${item.priceUsd}</strong> <span className="text-xs text-[#6a8588]">{es ? '/ persona' : '/ person'}</span></p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Barra fija de reserva (móvil y tableta). */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#dce7e1] bg-white/95 px-5 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_30px_rgba(26,65,69,.12)] backdrop-blur transition-transform duration-300 lg:hidden ${showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
        aria-hidden={!showBar}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm">
              <span className="text-xs text-[#6a8588]">{es ? 'Desde' : 'From'}</span>{' '}
              <strong className="text-lg">${experience.priceUsd}</strong>{' '}
              <span className="text-xs text-[#6a8588]">{es ? '/ persona' : '/ person'}</span>
            </p>
            <p className="truncate text-[11px] font-semibold text-[#256b54]">
              {es ? `Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`}
            </p>
          </div>
          <Link
            href={bookHref}
            tabIndex={showBar ? 0 : -1}
            className="shrink-0 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#963b18]"
          >
            {es ? 'Ver fechas' : 'Check dates'}
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

/**
 * Galería: foto principal con flechas y miniaturas debajo. En pantallas
 * táctiles también se puede deslizar la foto principal.
 */
function Gallery({
  images,
  tag,
  lang,
}: {
  images: { src: string; alt: Record<Locale, string> }[]
  tag: string | undefined
  lang: Locale
}) {
  const es = lang === 'ES'
  const [active, setActive] = useState(0)
  const touchStart = useRef<number | null>(null)
  const many = images.length > 1

  function go(delta: number) {
    setActive((current) => (current + delta + images.length) % images.length)
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-3xl bg-[#eaf1ed]"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX
        }}
        onTouchEnd={(event) => {
          if (!many || touchStart.current === null) return
          const delta = event.changedTouches[0].clientX - touchStart.current
          if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
          touchStart.current = null
        }}
      >
        <Picture
          key={images[active].src}
          src={images[active].src}
          sizes="(min-width: 1024px) 60vw, 100vw"
          alt={images[active].alt[lang]}
          fetchPriority={active === 0 ? 'high' : 'auto'}
          decoding="async"
          width={960}
          height={720}
          className="aspect-[4/3] h-full w-full object-cover"
        />
        {tag && (
          <span className="absolute left-4 top-4 rounded-full bg-[#f4d27c] px-3 py-1 text-xs font-bold text-[#173f45]">{tag}</span>
        )}
        {many && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label={es ? 'Foto anterior' : 'Previous photo'}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#173f45] shadow transition hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label={es ? 'Foto siguiente' : 'Next photo'}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#173f45] shadow transition hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <ul className="mt-3 flex gap-2" aria-label={es ? 'Fotos' : 'Photos'}>
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                onClick={() => setActive(index)}
                aria-label={`${es ? 'Ver foto' : 'View photo'} ${index + 1}: ${image.alt[lang]}`}
                aria-current={index === active}
                className={`block h-16 w-20 overflow-hidden rounded-xl transition sm:h-20 sm:w-28 ${index === active ? 'ring-2 ring-[#b8481c] ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
              >
                <Picture src={image.src} sizes="112px" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
