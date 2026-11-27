'use client'

import { Mail, MessageCircle } from 'lucide-react'
import { trackQuoteRequest } from '@/lib/analytics'
import { buildQuoteMailto } from '@/lib/quote'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { Locale } from '@/lib/data'

/**
 * Las dos vías de cotización del acuerdo 02: WhatsApp y correo.
 *
 * Un solo componente para que la portada y el detalle ofrezcan exactamente
 * lo mismo, con el mismo mensaje ya escrito y el mismo evento de analítica.
 *
 * WhatsApp va primero y como acción principal: es por donde escribe la
 * mayoría en El Salvador. El correo va siempre al lado: llega al correo
 * oficial del negocio (ver lib/quote.ts) y es la vía de quien prefiere
 * dejarlo por escrito o no tiene WhatsApp en el equipo desde el que mira.
 */
export function QuoteActions({
  service,
  lang,
  source,
  size = 'md',
  details,
  kind = 'service',
}: {
  /** Nombre del servicio que se cotiza. Entra en el mensaje y en el evento. */
  service: string
  lang: Locale
  /** De dónde sale la pulsación: «home» o «detalle». Va a la analítica. */
  source: string
  size?: 'md' | 'lg'
  /**
   * Resumen de la cotización, cuando el visitante viene de calcularla.
   * Viaja dentro del mensaje para que no tenga que repetir la ruta.
   */
  details?: string
  /** Qué se cotiza: el servicio de transporte o una experiencia. Cambia el texto del mensaje. */
  kind?: 'service' | 'experience'
}) {
  const es = lang === 'ES'
  const whatsappUrl = buildWhatsAppUrl({ lang, service, details, kind })
  const mailto = buildQuoteMailto({ lang, service, details, kind })

  const base = `inline-flex items-center justify-center gap-2 rounded-full font-bold transition ${
    size === 'lg' ? 'px-6 py-3.5 text-sm' : 'px-4 py-2.5 text-xs'
  }`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackQuoteRequest({ service, channel: 'whatsapp', source })}
        className={`${base} bg-accent text-white hover:bg-accent-dark`}
      >
        <MessageCircle size={size === 'lg' ? 18 : 15} aria-hidden="true" />
        {es ? 'Cotizar por WhatsApp' : 'Quote on WhatsApp'}
      </a>

      <a
        href={mailto}
        onClick={() => trackQuoteRequest({ service, channel: 'email', source })}
        className={`${base} border border-line-strong bg-surface text-brand hover:bg-surface-mint`}
      >
        <Mail size={size === 'lg' ? 18 : 15} aria-hidden="true" />
        {es ? 'Cotizar por correo' : 'Quote by email'}
      </a>
    </div>
  )
}
