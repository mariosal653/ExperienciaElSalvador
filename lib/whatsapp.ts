/**
 * Configuración y construcción del enlace de WhatsApp.
 *
 * Único lugar donde vive el número y los mensajes. Ningún componente
 * escribe un número ni un texto por su cuenta.
 *
 * Solo se usa el enlace oficial wa.me: nada de iframes, automatización ni
 * dependencias externas. El sistema operativo decide si abre la app, la
 * versión de escritorio o WhatsApp Web.
 */

import { parseLocalDate, type Locale } from './data'

export const whatsappConfig = {
  /**
   * Número del negocio. Se puede escribir de forma legible, con «+» y
   * espacios: se normaliza automáticamente antes de construir el enlace.
   */
  phone: '+503 7230 8067',

  /** Mensaje cuando el visitante no ha elegido nada todavía. */
  defaultMessage: {
    ES: 'Hola 👋, estoy visitando Experience El Salvador y quisiera recibir más información sobre las experiencias disponibles.',
    EN: 'Hi 👋, I am browsing Experience El Salvador and would like more information about the available experiences.',
  } satisfies Record<Locale, string>,

  /** Segundos antes de mostrar la burbuja de ayuda. */
  bubbleDelaySeconds: 8,
} as const

/**
 * Deja el número como lo exige wa.me: solo dígitos, sin «+», espacios ni
 * guiones. Para El Salvador, «+503 7230 8067» queda en «50372308067».
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

const MONTHS: Record<Locale, string[]> = {
  ES: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

function longDate(iso: string, lang: Locale): string | null {
  const date = parseLocalDate(iso)
  if (!date) return null
  return lang === 'ES'
    ? `${date.getDate()} de ${MONTHS.ES[date.getMonth()]}`
    : `${MONTHS.EN[date.getMonth()]} ${date.getDate()}`
}

/**
 * Lo que el visitante está mirando en este momento. Todo es opcional:
 * el mensaje solo menciona lo que realmente haya elegido.
 */
export type WhatsAppLead = {
  lang: Locale
  /** Nombre de la experiencia, si está viendo su detalle. */
  experience?: string | null
  destination?: string | null
  /** Fecha en formato AAAA-MM-DD. */
  date?: string | null
  people?: number | null
}

/**
 * Construye el mensaje según el contexto, de más específico a más general:
 *
 *   1. Viendo una experiencia  → la menciona por nombre.
 *   2. Con búsqueda hecha      → menciona destino, fecha y viajeros,
 *                                omitiendo lo que no haya elegido.
 *   3. Sin contexto            → mensaje por defecto.
 */
export function buildMessage(lead: WhatsAppLead): string {
  const lang = lead.lang

  if (lead.experience) {
    return lang === 'ES'
      ? `Hola 👋, estoy interesado en la experiencia ${lead.experience}. ¿Podrían brindarme más información?`
      : `Hi 👋, I am interested in the ${lead.experience} experience. Could you send me more information?`
  }

  const parts: string[] = []

  if (lead.destination) {
    parts.push(lang === 'ES' ? `en ${lead.destination}` : `in ${lead.destination}`)
  }

  if (lead.date) {
    const formatted = longDate(lead.date, lang)
    if (formatted) {
      parts.push(lang === 'ES' ? `para el ${formatted}` : `for ${formatted}`)
    }
  }

  if (lead.people && lead.people > 0) {
    parts.push(
      lang === 'ES'
        ? `para ${lead.people} ${lead.people === 1 ? 'persona' : 'personas'}`
        : `for ${lead.people} ${lead.people === 1 ? 'person' : 'people'}`,
    )
  }

  if (parts.length === 0) {
    return whatsappConfig.defaultMessage[lang]
  }

  // «en El Tunco para el 24 de septiembre, para 2 personas»
  const detail = parts.length > 1
    ? `${parts.slice(0, -1).join(' ')}, ${parts[parts.length - 1]}`
    : parts[0]

  return lang === 'ES'
    ? `Hola 👋, estoy interesado en conocer opciones ${detail}. ¿Podrían brindarme más información?`
    : `Hi 👋, I would like to know the options ${detail}. Could you send me more information?`
}

/** Enlace oficial de WhatsApp con el mensaje ya codificado. */
export function buildWhatsAppUrl(lead: WhatsAppLead): string {
  const phone = sanitizePhone(whatsappConfig.phone)
  const message = encodeURIComponent(buildMessage(lead))
  return `https://wa.me/${phone}?text=${message}`
}
