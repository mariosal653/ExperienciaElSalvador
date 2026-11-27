/**
 * Páginas que llevan la barra de navegación inferior en el celular
 * (components/site/mobile-nav.tsx). Son las de descubrir: inicio, destinos,
 * guías y servicios.
 *
 * Fuera quedan las que ya tienen algo fijo abajo o donde la barra
 * distraería: el detalle de una experiencia (su barra de «Reservar»), el
 * checkout y el pago, la cuenta, las entradas, el acceso y el panel.
 *
 * Lo usan la barra (para mostrarse) y el widget de WhatsApp (para
 * esconderse en el celular, porque la barra ya lleva WhatsApp).
 */
const PREFIXES = ['/destinos/', '/guias/', '/servicios/']

export function hasMobileNav(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === '/' || PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Clases de la cabecera cuando se baja por una página con barra inferior:
 * en el celular sube y desaparece, y queda solo la barra de abajo. En
 * escritorio (lg) no cambia nada. Vuelve al llegar arriba del todo, que es
 * donde están el idioma y la cuenta.
 */
export const HEADER_HIDDEN_ON_MOBILE =
  'max-lg:pointer-events-none max-lg:-translate-y-[calc(100%+1.5rem)] max-lg:opacity-0'
