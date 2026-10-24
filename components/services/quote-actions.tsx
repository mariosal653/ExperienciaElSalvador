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
 * mayoría en El Salvador. El correo aparece solo si está configurado
 * (ver lib/quote.ts): un `mailto:` sin destinatario no sirve de nada.
 */
export function QuoteActions({
  service,
  lang,
  source,
  size = 'md',
}: {
  /** Nombre del servicio que se cotiza. Entra en el mensaje y en el evento. */
  service: string
  lang: Locale
  /** De dónde sale la pulsación: «home» o «detalle». Va a la analítica. */
  source: string
  size?: 'md' | 'lg'
}) {
  const es = lang === 'ES'
  const whatsappUrl = buildWhatsAppUrl({ lang, service })
  const mailto = buildQuoteMailto({ lang, service })

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

      {mailto && (
        <a
          href={mailto}
          onClick={() => trackQuoteRequest({ service, channel: 'email', source })}
          className={`${base} border border-line-strong bg-surface text-brand hover:bg-surface-mint`}
        >
          <Mail size={size === 'lg' ? 18 : 15} aria-hidden="true" />
          {es ? 'Cotizar por correo' : 'Quote by email'}
        </a>
      )}
    </div>
  )
}
