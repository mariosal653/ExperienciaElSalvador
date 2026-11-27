'use client'

import Link from 'next/link'
import { ArrowRight, Check, Clock, Fuel, Hourglass, Languages, Snowflake, Users } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { QuoteActions } from '@/components/services/quote-actions'
import { useLanguage } from '@/components/i18n/language-provider'
import { formatUsd, guideAddOn, MIN_HOURS, personalDriver, vehicle } from '@/lib/services'

/**
 * Personal Driver en la portada: bloque destacado a todo lo ancho.
 *
 * Desde que Driver by Tour se retiró es el único servicio de transporte, y
 * el cliente pidió darle más realce. Por eso ya no es una tarjeta entre
 * dos, sino un bloque propio en verde de marca con la foto del microbús,
 * el precio grande, lo que incluye y las dos vías para cotizar.
 *
 * Va inmediatamente debajo del héroe (acuerdo 01): nada secundario debe
 * desplazarlo de la parte principal de la página.
 *
 * Lo que más pesa en la decisión va en las píldoras de arriba: gasolina y
 * espera incluidas y sin mínimo de horas. Es lo que lo distingue de
 * alquilar un carro o pedir taxis por tramos.
 */
export function ServicesSection() {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const service = personalDriver

  const perks = [
    { icon: Fuel, label: es ? 'Gasolina incluida' : 'Fuel included' },
    { icon: Hourglass, label: es ? 'Espera incluida' : 'Waiting included' },
    { icon: Clock, label: es ? `Mínimo ${MIN_HOURS} horas` : `${MIN_HOURS}-hour minimum` },
    { icon: Users, label: es ? `Hasta ${vehicle.seats} personas` : `Up to ${vehicle.seats} people` },
    { icon: Snowflake, label: es ? 'Aire acondicionado' : 'Air conditioning' },
  ]

  return (
    <section id="servicios" aria-labelledby="servicios-title" className="bg-surface-mint py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="on-dark overflow-hidden rounded-[2rem] bg-brand text-white shadow-card">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            {/* Texto, precio y cotización --------------------------------- */}
            <div className="p-7 md:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-gold-soft">
                {es ? 'Transporte privado con conductor' : 'Private transport with a driver'}
              </p>
              <h2 id="servicios-title" className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                {service.name}
              </h2>
              <p className="mt-2 font-serif text-xl italic text-gold-deep md:text-2xl">
                {es ? 'Muévete por El Salvador sin manejar.' : 'Get around El Salvador without driving.'}
              </p>
              <p className="mt-5 max-w-xl leading-relaxed text-white/80">{service.summary[lang]}</p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {perks.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15">
                    <Icon size={14} className="text-gold-soft" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-white/15 pt-6">
                <p className="flex items-baseline gap-2">
                  <span className="text-sm text-white/70">{es ? 'Desde' : 'From'}</span>
                  <strong className="text-5xl font-extrabold leading-none tracking-tight">
                    ${formatUsd(service.priceFromUsd ?? 0)}
                  </strong>
                  <span className="text-sm text-white/70">{service.priceUnit[lang]}</span>
                </p>
                <Link
                  href={`/servicios/${service.id}`}
                  className="group mb-1 inline-flex items-center gap-1.5 text-sm font-bold text-white underline-offset-4 hover:underline"
                >
                  {es ? 'Qué incluye y cómo funciona' : 'What is included and how it works'}
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-6">
                <QuoteActions service={service.name} lang={lang} source="home" size="lg" />
              </div>
            </div>

            {/* Vehículo y complemento ------------------------------------- */}
            <div className="flex flex-col justify-center gap-5 bg-white/[.06] p-7 md:p-10 lg:p-12">
              {/*
                La foto está recortada sobre fondo transparente: `object-contain`
                y proporción fija, para que el microbús se vea entero y la caja
                no cambie de alto entre idiomas ni al cargar.
              */}
              <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-cream p-4">
                <Picture
                  src={vehicle.image.src}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  alt={vehicle.image.alt[lang]}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={489}
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-white/60">{es ? 'El vehículo' : 'The vehicle'}</p>
                <p className="mt-1 text-lg font-semibold">
                  {vehicle.kind[lang]} {vehicle.model}
                </p>
                {/*
                  Solo lo que NO está ya en las píldoras de la izquierda:
                  repetir «gasolina incluida» o «hasta 7» aquí era ruido.
                */}
                <ul className="mt-3 grid gap-1.5 text-sm text-white/80 sm:grid-cols-2">
                  {(es
                    ? ['Espacio para equipaje', 'Conductor local que conoce las rutas', 'Paradas y horarios a tu medida', 'Varios días seguidos, si lo necesitas']
                    : ['Room for luggage', 'Local driver who knows the roads', 'Stops and timing your way', 'Several days in a row, if you need it']
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-gold-soft" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Complemento, no servicio: se nombra con su precio y su unidad. */}
              <p className="flex items-start gap-2 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-white/80">
                <Languages size={16} className="mt-0.5 shrink-0 text-gold-soft" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-white">
                    {guideAddOn.name[lang]} · +${guideAddOn.priceUsd} {guideAddOn.unit[lang]}
                  </strong>
                  {' — '}
                  {guideAddOn.description[lang]}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
