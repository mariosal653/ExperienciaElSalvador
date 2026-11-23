import type { Locale } from './data'
import { CONTACT_EMAIL } from './contact'

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
 * El destinatario es el CORREO OFICIAL del negocio, el mismo que está en el
 * Perfil de Empresa y en el pie del sitio (lib/contact.ts). Antes esto
 * dependía solo de NEXT_PUBLIC_QUOTE_EMAIL y, como esa variable nunca se
 * puso en Netlify, el botón de «Cotizar por correo» no se llegó a ver
 * nunca en producción: de las dos vías del acuerdo 02 solo funcionaba una.
 *
 * La variable sigue mandando cuando existe, para poder desviar las
 * cotizaciones a otro buzón (ventas, un CRM) sin tocar el repositorio ni
 * mover el correo de contacto, que tiene que seguir coincidiendo con el
 * Perfil de Empresa.
 */

/** Correo al que llegan las cotizaciones. Siempre hay uno. */
export const quoteEmail: string = process.env.NEXT_PUBLIC_QUOTE_EMAIL?.trim() || CONTACT_EMAIL

export type QuoteLead = {
  lang: Locale
  /** Nombre del servicio (o de la experiencia) que se está cotizando. */
  service: string
  /** Qué se cotiza: el servicio de transporte (por defecto) o una experiencia. */
  kind?: 'service' | 'experience'
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
export function quoteBody({ lang, service, details, kind }: QuoteLead): string {
  const es = lang === 'ES'
  const what = kind === 'experience'
    ? (es ? `la experiencia ${service}` : `the ${service} experience`)
    : (es ? `el servicio ${service}` : `the ${service} service`)
  const intro = es ? `Hola, quisiera cotizar ${what}.` : `Hello, I would like a quote for ${what}.`

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
 * Enlace `mailto:` con asunto y cuerpo codificados.
 *
 * Los saltos de línea van como %0A (encodeURIComponent los deja así), que
 * es lo que entienden los clientes de correo.
 */
export function buildQuoteMailto(lead: QuoteLead): string {
  const subject = encodeURIComponent(quoteSubject(lead))
  const body = encodeURIComponent(quoteBody(lead))
  return `mailto:${quoteEmail}?subject=${subject}&body=${body}`
}
