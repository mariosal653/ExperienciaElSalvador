'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/i18n/language-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import type { Locale } from '@/lib/data'
import { LEGAL_SLUGS, type LegalSlug } from '@/lib/legal'

/*
 * IMPORTANTE — REVISIÓN LEGAL PENDIENTE
 *
 * Estos textos son una BASE razonable para operar, no asesoría legal. Los
 * plazos de cancelación y reembolso son una decisión del negocio: antes de
 * cobrar con Wompi en producción, revisarlos con un abogado en El Salvador
 * (Ley de Protección al Consumidor, Ley de Comercio Electrónico) y ajustar
 * aquí. Cambiar el texto no requiere tocar nada más.
 */


type Section = { heading: string; body: string[] }
type Doc = { title: string; updated: string; sections: Section[] }

const UPDATED = { ES: 'Última actualización: 10 de septiembre de 2026', EN: 'Last updated: September 10, 2026' }

const DOCS: Record<LegalSlug, Record<Locale, Doc>> = {
  terms: {
    ES: {
      title: 'Términos y condiciones',
      updated: UPDATED.ES,
      sections: [
        { heading: 'Quiénes somos', body: ['Experience El Salvador es una plataforma para descubrir y reservar experiencias turísticas en El Salvador operadas por guías y anfitriones locales.'] },
        { heading: 'Reservas y pago', body: ['Puedes reservar sin crear una cuenta. La reserva se confirma solo cuando la pasarela de pago Wompi aprueba el cobro; hasta entonces las plazas se guardan durante 30 minutos.', 'Los precios se muestran en dólares estadounidenses (USD) por persona. El importe final se calcula en nuestro servidor y es el que verás en la página de pago.', 'Los datos de tu tarjeta se introducen en la página segura de Wompi. Experience El Salvador no ve ni almacena esos datos.'] },
        { heading: 'Entradas', body: ['Recibirás una entrada digital con código QR por cada viajero. Cada entrada es válida para una persona, en la fecha reservada, y solo puede usarse una vez.', 'Guarda el enlace de tu reserva: es tu acceso a las entradas. No lo compartas públicamente.'] },
        { heading: 'Responsabilidades del viajero', body: ['Llega puntual al punto de encuentro, sigue las indicaciones del guía y valora con honestidad tu condición física para cada actividad. Algunas experiencias pueden modificarse por clima o por seguridad.'] },
        { heading: 'Contacto', body: ['Para cualquier consulta sobre tu reserva, escríbenos por WhatsApp desde el botón del sitio indicando tu número de reserva.'] },
      ],
    },
    EN: {
      title: 'Terms and Conditions',
      updated: UPDATED.EN,
      sections: [
        { heading: 'Who we are', body: ['Experience El Salvador is a platform to discover and book tourism experiences in El Salvador run by local guides and hosts.'] },
        { heading: 'Bookings and payment', body: ['You can book without creating an account. A booking is confirmed only when the Wompi payment gateway approves the charge; until then your spots are held for 30 minutes.', 'Prices are shown in US dollars (USD) per person. The final amount is calculated on our server and is the amount you will see on the payment page.', "Your card details are entered on Wompi's secure page. Experience El Salvador never sees or stores them."] },
        { heading: 'Tickets', body: ['You will receive one digital ticket with a QR code per traveler. Each ticket is valid for one person, on the booked date, and can be used only once.', 'Keep your booking link safe: it is your access to the tickets. Do not share it publicly.'] },
        { heading: 'Traveler responsibilities', body: ['Arrive on time at the meeting point, follow your guide’s instructions and honestly assess your fitness for each activity. Some experiences may change due to weather or safety.'] },
        { heading: 'Contact', body: ['For any question about your booking, message us on WhatsApp from the button on the site and include your booking number.'] },
      ],
    },
  },
  cancellation: {
    ES: {
      title: 'Política de cancelación',
      updated: UPDATED.ES,
      sections: [
        { heading: 'Cancelación por el viajero', body: ['Más de 48 horas antes de la experiencia: reembolso completo.', 'Entre 48 y 24 horas antes: reembolso del 50 %.', 'Menos de 24 horas antes o no presentarse: sin reembolso.'] },
        { heading: 'Cancelación por el operador', body: ['Si cancelamos por clima, seguridad u otra causa, te ofreceremos otra fecha o el reembolso completo, a tu elección.'] },
        { heading: 'Cómo solicitarla', body: ['Escríbenos por WhatsApp con tu número de reserva. Los reembolsos se hacen a la misma tarjeta a través de Wompi; el tiempo en que se reflejan depende de tu banco.'] },
      ],
    },
    EN: {
      title: 'Cancellation Policy',
      updated: UPDATED.EN,
      sections: [
        { heading: 'Cancellation by the traveler', body: ['More than 48 hours before the experience: full refund.', 'Between 48 and 24 hours before: 50% refund.', 'Less than 24 hours before, or no-show: no refund.'] },
        { heading: 'Cancellation by the operator', body: ['If we cancel because of weather, safety or any other reason, we will offer you another date or a full refund — your choice.'] },
        { heading: 'How to request it', body: ['Message us on WhatsApp with your booking number. Refunds go back to the same card through Wompi; how long they take to appear depends on your bank.'] },
      ],
    },
  },
  privacy: {
    ES: {
      title: 'Política de privacidad',
      updated: UPDATED.ES,
      sections: [
        { heading: 'Qué datos recogemos', body: ['Al reservar: nombre, correo, teléfono y, si quieres, país. Si creas una cuenta, además tu contraseña, que se guarda cifrada (hash) y nunca en claro.', 'No recogemos ni guardamos datos de tarjetas: el pago se hace en la página de Wompi.'] },
        { heading: 'Para qué los usamos', body: ['Para gestionar tu reserva, enviarte la confirmación y las entradas, y contactarte si hay cambios en tu experiencia. No vendemos tus datos.'] },
        { heading: 'Con quién los compartimos', body: ['Con Wompi para procesar el pago, con nuestro proveedor de correo para enviarte la confirmación, y con el guía u operador de tu experiencia en la medida necesaria para prestarla.'] },
        { heading: 'Tus derechos', body: ['Puedes pedir acceso, corrección o eliminación de tus datos escribiéndonos por WhatsApp. Conservaremos lo mínimo que exija la ley para fines contables.'] },
      ],
    },
    EN: {
      title: 'Privacy Policy',
      updated: UPDATED.EN,
      sections: [
        { heading: 'What we collect', body: ['When you book: name, email, phone and, optionally, country. If you create an account, also your password, stored only as a hash — never in plain text.', "We do not collect or store card details: payment happens on Wompi's page."] },
        { heading: 'How we use it', body: ['To manage your booking, send your confirmation and tickets, and contact you if anything changes. We do not sell your data.'] },
        { heading: 'Who we share it with', body: ['Wompi to process the payment, our email provider to send your confirmation, and the guide or operator of your experience as needed to run it.'] },
        { heading: 'Your rights', body: ['You can ask to access, correct or delete your data by messaging us on WhatsApp. We keep the minimum required by law for accounting.'] },
      ],
    },
  },
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const { lang } = useLanguage()
  const doc = DOCS[slug][lang]
  const es = lang === 'ES'

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-10 lg:px-8">
        <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label={es ? 'Documentos legales' : 'Legal documents'}>
          {LEGAL_SLUGS.map((item) => (
            <Link
              key={item}
              href={`/legal/${item}`}
              aria-current={item === slug ? 'page' : undefined}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                item === slug ? 'bg-[#173f45] text-white' : 'border border-[#dce7e1] bg-white hover:bg-[#eaf1ed]'
              }`}
            >
              {DOCS[item][lang].title}
            </Link>
          ))}
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-[#6a8588]">{doc.updated}</p>
        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 leading-relaxed text-[#547176]">{paragraph}</p>
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  )
}
