import { experienceName, type Experience, type Locale } from './data'
import { buildWhatsAppUrl } from './whatsapp'

/**
 * Cotización de una experiencia que no se reserva en línea (`booking:
 * 'quote'`). El precio del catálogo es solo una REFERENCIA por persona: el
 * equipo lo confirma por WhatsApp o correo antes de cerrar nada.
 *
 * El texto viaja dentro del mensaje para que el cliente no tenga que
 * explicar qué está viendo ni cuánto decía la web.
 */
export function quoteDetails(experience: Pick<Experience, 'name' | 'priceUsd'>, lang: Locale): string {
  const es = lang === 'ES'
  const price =
    experience.priceUsd === null
      ? es ? 'Precio: a consultar' : 'Price: on request'
      : es
        ? `Precio de referencia en la web: $${experience.priceUsd} por persona`
        : `Reference price on the website: $${experience.priceUsd} per person`
  return [
    `${es ? 'Experiencia' : 'Experience'}: ${experienceName(experience, lang)}`,
    price,
    es ? 'Fecha que me interesa:' : 'Date I am interested in:',
    es ? 'Número de personas:' : 'Number of people:',
  ].join('\n')
}

/** Enlace de WhatsApp con la cotización de la experiencia ya escrita. */
export function experienceQuoteWhatsApp(experience: Pick<Experience, 'name' | 'priceUsd'>, lang: Locale): string {
  return buildWhatsAppUrl({
    lang,
    kind: 'experience',
    service: experienceName(experience, lang),
    details: quoteDetails(experience, lang),
  })
}
