'use client'

import { Languages, Snowflake, Users } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { ServiceCard } from '@/components/services/service-card'
import { useLanguage } from '@/components/i18n/language-provider'
import { guideAddOn, services, vehicle } from '@/lib/services'

/**
 * Servicios principales de la portada: Driver by Tour y Personal Driver.
 *
 * Va INMEDIATAMENTE DEBAJO DEL HÉROE, antes de los reels, del catálogo y
 * de cualquier otra banda. Es el acuerdo 01 del documento: nada secundario
 * debe desplazar estas dos ofertas de la parte principal de la página. Si
 * algún día hay que insertar otra sección, va por debajo de esta.
 *
 * El vehículo se muestra aquí mismo, no en una tercera tarjeta: quien
 * cotiza un traslado quiere saber en qué viaja, pero el microbús no es un
 * servicio que se venda por separado. Lo mismo con el guía bilingüe.
 */
export function ServicesSection() {
  const { lang } = useLanguage()
  const es = lang === 'ES'

  return (
    <section id="servicios" aria-labelledby="servicios-title" className="bg-surface-mint py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-accent">
            {es ? 'Transporte con conductor' : 'Transport with a driver'}
          </p>
          <h2 id="servicios-title" className="text-3xl font-semibold tracking-tight md:text-4xl">
            {es ? (
              <>Muévete por El Salvador <em className="font-serif font-normal">sin manejar.</em></>
            ) : (
              <>Get around El Salvador <em className="font-serif font-normal">without driving.</em></>
            )}
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            {es
              ? 'Dos formas de contratarnos: te llevamos a un tour concreto o pones el vehículo y el conductor a tu disposición por horas. En los dos casos te damos el total antes de que decidas.'
              : 'Two ways to hire us: we drive you to one specific tour, or you get the vehicle and driver at your disposal by the hour. Either way you get the total before you decide.'}
          </p>
        </div>

        {/* Dos tarjetas, dos servicios. Ver la nota de lib/services.ts. */}
        <div className="mt-10 grid gap-5 lg:grid-cols-2 lg:gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} lang={lang} />
          ))}
        </div>

        {/* El vehículo y el complemento: apoyo de los dos servicios. */}
        <div className="mt-6 grid gap-5 overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] sm:items-center sm:gap-7 lg:p-6">
          {/*
            La foto está recortada sobre fondo transparente: `object-contain`
            y proporción fija, para que el microbús se vea entero y la caja
            no cambie de alto entre idiomas ni al cargar.
          */}
          <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-surface-soft p-3">
            <Picture
              src={vehicle.image.src}
              sizes="(min-width: 640px) 40vw, 100vw"
              alt={vehicle.image.alt[lang]}
              loading="lazy"
              decoding="async"
              width={800}
              height={489}
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">
              {es ? 'El vehículo' : 'The vehicle'}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-brand">
              {vehicle.kind[lang]} {vehicle.model}
            </h3>

            <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5 text-xs">
              <li className="flex items-center gap-1.5 rounded-full bg-surface-mint px-2.5 py-1.5 font-semibold text-brand">
                <Users size={13} aria-hidden="true" />
                {es ? `Hasta ${vehicle.seats} pasajeros` : `Up to ${vehicle.seats} passengers`}
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-surface-mint px-2.5 py-1.5 font-semibold text-brand">
                <Snowflake size={13} aria-hidden="true" />
                {es ? 'Aire acondicionado' : 'Air conditioning'}
              </li>
            </ul>

            {/* Complemento, no servicio: se nombra con su precio y su unidad. */}
            <p className="mt-4 flex items-start gap-2 border-t border-line-soft pt-4 text-sm leading-relaxed text-muted">
              <Languages size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-brand">
                  {guideAddOn.name[lang]} · ${guideAddOn.priceUsd} {guideAddOn.unit[lang]}
                </strong>
                {' — '}
                {guideAddOn.description[lang]}
              </span>
            </p>

            {vehicle.illustration && (
              <p className="mt-3 text-xs text-faint">
                {es
                  ? 'Ilustración de referencia del modelo del servicio.'
                  : 'Reference illustration of the service vehicle.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
