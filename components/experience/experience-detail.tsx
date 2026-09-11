'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock, MapPin, QrCode, ShieldCheck, Star, Users } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import type { Experience } from '@/lib/data'

const WEEKDAYS = {
  ES: ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'],
  EN: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'],
}

function scheduleLabel(weekdays: number[], es: boolean): string {
  if (weekdays.length === 7) return es ? 'Todos los días' : 'Every day'
  // Lunes primero, domingo al final.
  const ordered = [...weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const names = ordered.map((day) => WEEKDAYS[es ? 'ES' : 'EN'][day])
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} ${es ? 'y' : 'and'} ${names[names.length - 1]}`
}

export function ExperienceDetail({ experience, related }: { experience: Experience; related: Experience[] }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'

  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({ lang, experience: experience.title, destination: experience.destination, date: null, people: null })
  }, [lang, experience.title, experience.destination, setLead])

  const bookHref = `/checkout/${experience.id}`
  const schedule = scheduleLabel(experience.weekdays, es)

  const facts = [
    { icon: Clock, label: es ? 'Duración' : 'Duration', value: `${experience.durationHours} ${es ? 'horas' : 'hours'}` },
    { icon: Users, label: es ? 'Grupo' : 'Group size', value: `${es ? 'Hasta' : 'Up to'} ${experience.maxPeople}` },
    { icon: CalendarDays, label: es ? 'Salidas' : 'Departures', value: schedule },
  ]

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-6 lg:px-8 lg:pt-8">
        <nav aria-label={es ? 'Ruta de navegación' : 'Breadcrumb'} className="mb-5 flex flex-wrap items-center gap-1 text-xs text-[#6a8588]">
          <Link href="/" className="hover:text-[#173f45] hover:underline">{es ? 'Inicio' : 'Home'}</Link>
          <ChevronRight size={12} />
          <Link href="/#experiencias" className="hover:text-[#173f45] hover:underline">{es ? 'Experiencias' : 'Experiences'}</Link>
          <ChevronRight size={12} />
          <span aria-current="page" className="font-semibold text-[#173f45]">{experience.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div className="relative overflow-hidden rounded-3xl bg-[#eaf1ed]">
            <img
              src={experience.image}
              alt={experience.imageAlt[lang]}
              fetchPriority="high"
              decoding="async"
              width={960}
              height={720}
              className="aspect-[4/3] h-full w-full object-cover"
            />
            {experience.tag && (
              <span className="absolute left-4 top-4 rounded-full bg-[#f4d27c] px-3 py-1 text-xs font-bold text-[#173f45]">
                {experience.tag[lang]}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#6a8588]">
              <MapPin size={15} /> {experience.destination}
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{experience.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <Star size={15} fill="#f4b942" className="text-[#f4b942]" />
              <strong>{experience.rating.toFixed(1)}</strong>
              <span className="text-[#6a8588]">
                ({experience.reviews} {es ? 'reseñas' : 'reviews'})
              </span>
            </p>

            <p className="mt-5 leading-relaxed text-[#547176]">{experience.description[lang]}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
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

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(26,65,69,.08)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <p>
                  <span className="text-xs text-[#6a8588]">{es ? 'Desde' : 'From'}</span>{' '}
                  <strong className="text-3xl">${experience.priceUsd}</strong>{' '}
                  <span className="text-sm text-[#6a8588]">{es ? '/ persona' : '/ person'}</span>
                </p>
                <Link
                  href={bookHref}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#b8481c] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45] sm:w-auto"
                >
                  {es ? 'Reservar ahora' : 'Book Now'} <ArrowRight size={16} />
                </Link>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#6a8588]">
                <ShieldCheck size={14} className="shrink-0 text-[#256b54]" />
                {es
                  ? 'Sin crear cuenta · Pago seguro con Wompi · Entrada digital con QR'
                  : 'No account needed · Secure payment with Wompi · Digital QR ticket'}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-2" aria-labelledby="highlights">
          <div>
            <h2 id="highlights" className="text-xl font-semibold">{es ? 'Lo mejor' : 'Highlights'}</h2>
            <ul className="mt-4 grid gap-2.5">
              {experience.highlights[lang].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#547176]">
                  <Check size={17} className="mt-0.5 shrink-0 text-[#b8481c]" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{es ? 'Cómo funciona' : 'How it works'}</h2>
            <ol className="mt-4 grid gap-2.5 text-sm text-[#547176]">
              {(es
                ? ['Elige fecha y número de viajeros.', 'Deja tus datos de contacto: no hace falta cuenta.', 'Paga con tarjeta en la página segura de Wompi.', 'Recibe tu confirmación y una entrada con QR por viajero.']
                : ['Pick a date and the number of travelers.', 'Leave your contact details — no account needed.', "Pay by card on Wompi's secure page.", 'Get your confirmation and one QR ticket per traveler.']
              ).map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf1ed] text-xs font-bold text-[#173f45]">{index + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex items-center gap-2 text-xs text-[#6a8588]">
              <QrCode size={14} /> {es ? 'Presenta el QR de cada entrada al llegar.' : 'Show each ticket QR code on arrival.'}
            </p>
          </div>
        </section>

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
                    <img src={item.image} alt={item.imageAlt[lang]} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-1 text-xs text-[#6a8588]"><MapPin size={13} />{item.destination}</p>
                    <p className="mt-1 font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm"><strong>${item.priceUsd}</strong> <span className="text-xs text-[#6a8588]">{es ? '/ persona' : '/ person'}</span></p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
