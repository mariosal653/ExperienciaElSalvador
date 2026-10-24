/**
 * Eventos de Google Analytics 4.
 *
 * Todo pasa por `track`, que no hace nada sin NEXT_PUBLIC_GA_ID (local,
 * previews). Con un bloqueador de anuncios los eventos quedan en la cola y
 * no salen nunca. Ninguna llamada puede romper la página.
 *
 * Los nombres siguen los eventos recomendados de GA4 para comercio
 * (search, view_item, begin_checkout, purchase), y así los informes de
 * embudo y de ingresos funcionan sin configurar nada en GA.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: Gtag
  }
}

// Rutas con una llave en la URL: se registran sin ella, porque la llave
// da acceso a la reserva y no debe acabar en los informes de Google.
const PRIVATE_PREFIXES = ['/booking/', '/ticket/', '/checkout/mock/']

export function safePath(pathname: string) {
  const prefix = PRIVATE_PREFIXES.find((p) => pathname.startsWith(p))
  return prefix ? `${prefix}[token]` : pathname
}

/**
 * URL que se manda a GA. La query se conserva (trae los utm_* de campañas
 * y anuncios), salvo en el pago: el retorno de la pasarela lleva ids de
 * transacción y firmas. Va en CADA evento, porque si no gtag adjunta la
 * URL real del navegador, con la llave incluida.
 */
export function safeLocation() {
  const { origin, pathname, search } = window.location
  const path = safePath(pathname)
  const keepQuery = path === pathname && !pathname.startsWith('/checkout/')
  return `${origin}${path}${keepQuery ? search : ''}`
}

type DataLayerWindow = Window & { dataLayer?: unknown[] }

/**
 * Define `gtag` como cola sobre `dataLayer`: lo enviado antes de que
 * llegue gtag.js se guarda y se procesa después. Se llama desde aquí y no
 * solo desde <GoogleAnalytics>, porque los efectos de cada página corren
 * ANTES que el del layout y sus eventos se perderían.
 */
export function ensureGtag(): boolean {
  if (!GA_ID || typeof window === 'undefined') return false
  const w = window as DataLayerWindow
  if (typeof w.gtag === 'function') return true
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // gtag.js exige el objeto `arguments`, no un array.
    w.dataLayer!.push(arguments)
  }
  // `send_page_view: false`: Next navega sin recargar, así que la vista
  // la envía <GoogleAnalytics> en cada cambio de ruta.
  w.gtag('js', new Date())
  w.gtag('config', GA_ID, { send_page_view: false, page_location: safeLocation() })
  return true
}

export function track(name: string, params?: Record<string, unknown>) {
  if (!ensureGtag()) return
  try {
    window.gtag!('event', name, { ...params, page_location: safeLocation() })
  } catch {
    // La analítica nunca debe interrumpir al visitante.
  }
}

type Item = { id: string; name: string; priceUsd: number; destination?: string; people?: number }

function toItem({ id, name, priceUsd, destination, people }: Item) {
  return { item_id: id, item_name: name, item_category: destination, price: priceUsd, quantity: people ?? 1 }
}

export function trackSearch(criteria: { destination: string | null; date: string | null; people: number }) {
  track('search', {
    search_term: criteria.destination ?? 'any',
    travel_date: criteria.date ?? 'any',
    travelers: criteria.people,
  })
}

export function trackViewItem(item: Item) {
  track('view_item', { currency: 'USD', value: item.priceUsd, items: [toItem(item)] })
}

export function trackBeginCheckout(item: Item & { people: number }, payLater: boolean) {
  track('begin_checkout', {
    currency: 'USD',
    value: item.priceUsd * item.people,
    pay_later: payLater,
    items: [toItem(item)],
  })
}

/**
 * Compra confirmada. La página de la reserva se puede abrir muchas veces
 * (correo, recarga, entradas), así que se recuerda en el navegador qué
 * reservas ya se contaron para no inflar los ingresos.
 */
export function trackPurchase(booking: {
  code: string
  experienceId: string
  experienceTitle: string
  totalCents: number
  unitPriceCents: number
  people: number
  currency: string
  isTest: boolean
}) {
  const key = `ees:ga:purchase:${booking.code}`
  try {
    if (localStorage.getItem(key)) return
  } catch {
    // Sin almacenamiento se cuenta igual: mejor un duplicado raro que nada.
  }
  track('purchase', {
    transaction_id: booking.code,
    currency: booking.currency,
    value: booking.totalCents / 100,
    // Las reservas de prueba (Wompi sandbox/mock) se marcan para poder
    // excluirlas en los informes.
    test_booking: booking.isTest,
    items: [
      {
        item_id: booking.experienceId,
        item_name: booking.experienceTitle,
        price: booking.unitPriceCents / 100,
        quantity: booking.people,
      },
    ],
  })
  try {
    localStorage.setItem(key, '1')
  } catch {
    // Ver arriba.
  }
}

export function trackWhatsApp(source: string) {
  track('contact_whatsapp', { source })
}

/**
 * Solicitud de cotización de un servicio de conductor. `channel` distingue
 * WhatsApp de correo: son las dos vías del acuerdo y conviene saber cuál
 * usa la gente antes de construir el cotizador automático.
 */
export function trackQuoteRequest(params: { service: string; channel: 'whatsapp' | 'email'; source: string }) {
  track('quote_request', params)
}
