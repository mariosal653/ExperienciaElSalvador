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
