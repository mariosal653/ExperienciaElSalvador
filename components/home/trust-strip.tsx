import { MessageCircle, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import type { Locale } from '@/lib/data'
import { FREE_CANCELLATION_HOURS } from '@/lib/experience-details'
import { whatsappConfig } from '@/lib/whatsapp'

/**
 * Franja de confianza, justo debajo del héroe: las garantías que el
 * visitante busca antes de dar un paso, juntas y a la vista, como hacen
 * GetYourGuide o Viator junto al buscador.
 *
 * SOLO PROMESAS QUE SE CUMPLEN SIEMPRE. Cada línea sale de un dato del
 * código (horas de cancelación, teléfono, tamaño máximo de grupo); si el
 * dato cambia, la franja cambia con él. No poner aquí tiempos de respuesta
 * ni sellos que no se puedan sostener.
 */
export function TrustStrip({ lang, maxPeople }: { lang: Locale; maxPeople: number }) {
  const es = lang === 'ES'
  const items = [
    {
      icon: ShieldCheck,
      title: es ? `Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`,
      text: es ? 'En los tours que reservas en línea' : 'On the tours you book online',
    },
    {
      icon: MessageCircle,
      title: es ? 'Te atendemos por WhatsApp' : 'We help you on WhatsApp',
      text: whatsappConfig.phone,
    },
    {
      icon: UserRound,
      title: es ? 'Guías y conductores locales' : 'Local guides and drivers',
      text: es ? 'Gente que conoce cada camino' : 'People who know every road',
    },
    {
      icon: UsersRound,
      title: es ? 'Grupos pequeños' : 'Small groups',
      text: es ? `Hasta ${maxPeople} personas por salida` : `Up to ${maxPeople} people per departure`,
    },
  ]

  return (
    <section aria-label={es ? 'Por qué reservar con nosotros' : 'Why book with us'} className="border-b border-line bg-white">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-5 py-6 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-mint text-brand" aria-hidden="true">
              <Icon size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-snug text-brand">{title}</span>
              <span className="mt-0.5 block text-xs text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
