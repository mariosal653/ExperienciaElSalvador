import type { Locale } from './data'

/**
 * Cotización por correo electrónico.
 *
 * El acuerdo pide dos vías de cotización visibles: WhatsApp (ver
 * lib/whatsapp.ts) y correo. Aquí vive la del correo.
 *
 * Mientras no exista el cotizador automático, el correo se abre con un
 * `mailto:` que ya lleva asunto y un cuerpo con las preguntas que el
 * equipo necesita responder para dar un total: fecha, punto de recogida,
 * pasajeros y ruta. Un formulario propio llegaría a lo mismo con un
 * endpoint, una base y un antispam de más; cuando se construya el
 * cotizador, este archivo es el único punto que cambia.
 *
 * SIN CORREO CONFIGURADO no se muestra el botón: un `mailto:` vacío abre
 * el cliente de correo sin destinatario y el visitante no vuelve.
 * Configurar NEXT_PUBLIC_QUOTE_EMAIL para activarlo (ver .env.example).
 */

/** Correo público al que llegan las cotizaciones, o null si no se configuró. */
export const quoteEmail: string | null = process.env.NEXT_PUBLIC_QUOTE_EMAIL?.trim() || null

export type QuoteLead = {
  lang: Locale
  /** Nombre del servicio que se está cotizando. */
  service: string
  /**
   * Resumen de la cotización (ruta, distancia, total) cuando viene del
   * cotizador automático. Sustituye a las preguntas que ya ha respondido.
   */
  details?: string | null
}

/** Asunto del correo. Lleva el servicio para poder filtrarlo en la bandeja. */
export function quoteSubject({ lang, service }: QuoteLead): string {
  return lang === 'ES'
    ? `Cotización: ${service}`
    : `Quote request: ${service}`
}

/**
 * Cuerpo del correo: las preguntas cuya respuesta hace falta para cotizar,
 * ya escritas, para que el visitante solo rellene.
 */
export function quoteBody({ lang, service, details }: QuoteLead): string {
  const es = lang === 'ES'
  const intro = es
    ? `Hola, quisiera cotizar el servicio ${service}.`
    : `Hello, I would like a quote for the ${service} service.`

  // Con la ruta ya montada en el cotizador, se manda esa y solo se
  // pregunta lo que falta: volver a pedir la ruta sería hacerla dos veces.
  const pending = es
    ? ['Fecha:', 'Hora de recogida:', 'Punto exacto de recogida:', 'Número de pasajeros:', 'Guía bilingüe: sí / no']
    : ['Date:', 'Pickup time:', 'Exact pickup point:', 'Number of passengers:', 'Bilingual guide: yes / no']

  const route = es
    ? ['Ruta o lugares que quiero visitar:']
    : ['Route or places I want to visit:']

  const closing = es ? 'Gracias.' : 'Thank you.'

  return [intro, '', ...(details ? [details, ''] : []), ...pending, ...(details ? [] : route), '', closing].join('\n')
}

/**
 * Enlace `mailto:` con asunto y cuerpo codificados, o null si no hay
 * correo configurado.
 *
 * Los saltos de línea van como %0A (encodeURIComponent los deja así), que
 * es lo que entienden los clientes de correo.
 */
export function buildQuoteMailto(lead: QuoteLead): string | null {
  if (!quoteEmail) return null
  const subject = encodeURIComponent(quoteSubject(lead))
  const body = encodeURIComponent(quoteBody(lead))
  return `mailto:${quoteEmail}?subject=${subject}&body=${body}`
}
