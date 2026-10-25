/**
 * Datos de contacto públicos del negocio.
 *
 * Están aquí, en un solo sitio, porque tienen que coincidir EXACTAMENTE con
 * el Perfil de Empresa en Google: nombre, teléfono, correo y web. Esa
 * coincidencia (lo que en SEO local se llama NAP) es la señal con la que
 * Google entiende que el perfil de Maps y este dominio son el mismo negocio.
 * Si un dato se cambia aquí, hay que cambiarlo también en el perfil.
 *
 * El teléfono no se repite: vive en `whatsapp.ts`, que ya lo necesita para
 * construir el enlace de wa.me.
 */

/** Correo público, para consultas y ejercicio de derechos sobre los datos. */
export const CONTACT_EMAIL = 'discover@experiencesinelsalvador.com'

/** Nombre del negocio, tal y como aparece en el Perfil de Empresa. */
export const BUSINESS_NAME = 'Experiences El Salvador'

/**
 * Ficha del negocio en Google Maps, en la forma canónica por `cid`: es la
 * URL estable del Perfil de Empresa, la que no cambia aunque se edite el
 * nombre o la dirección. Sale del identificador del propio perfil
 * (place_id ChIJOdtPSH5lhQsRgwrYUld0AJw).
 *
 * Va en `sameAs` de los datos estructurados de la portada. Junto con el
 * enlace que el perfil hace al sitio, cierra la relación en los dos
 * sentidos, que es lo que permite a Google tratarlos como un mismo negocio.
 */
export const GOOGLE_PROFILE_URL = 'https://maps.google.com/?cid=11241112588317624963'

/**
 * Enlace directo al formulario de reseña del perfil. No se usa en el sitio:
 * es el que se le pasa al cliente por WhatsApp al terminar el servicio.
 * Se documenta aquí para no perderlo. Ver docs/SEO.md.
 */
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CYMK2FJXdACcEBM/review'
