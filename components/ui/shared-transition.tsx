import { ViewTransition, type ReactNode } from 'react'

/**
 * Transición «elemento compartido» entre una tarjeta y la página a la que
 * lleva. Al navegar, React busca en la página vieja y en la nueva el mismo
 * `name` y el navegador anima la foto (y el título) desde la tarjeta hasta
 * su sitio en la página nueva, en lugar de cambiar de golpe.
 *
 * - `share` pone la clase que usa el CSS (bloque VIEW TRANSITIONS de
 *   app/globals.css): duración, curva y el recorte de la foto.
 * - `default="none"`: sin él, cada foto con nombre haría su propio
 *   fundido en CUALQUIER navegación de la página. Con él hay que dejar
 *   `share` puesto, o la pareja deja de transformarse.
 *
 * Cada nombre debe ser único en la página, y solo debe haber UNA pareja
 * por navegación. Las listas de tarjetas que aparecen en varias páginas
 * (destinos relacionados, catálogo de experiencias) pasan `enabled` solo
 * a la tarjeta que se acaba de pulsar: si todas lo llevaran siempre, al
 * cambiar de página volarían todas las que coincidan, no solo la elegida.
 *
 * La página de destino debe estar arriba del todo cuando el navegador la
 * captura, o la foto no tendrá a dónde volar: ver el useLayoutEffect de
 * components/destination/destination-view.tsx.
 *
 * Sin soporte del navegador (Firefox antiguo, etc.) no pasa nada: la
 * navegación funciona igual, solo que sin animación.
 */
type Props = {
  name: string
  /** false: se pinta igual pero SIN nombre, así que no participa. */
  enabled?: boolean
  children: ReactNode
}

export function SharedPhoto({ name, enabled = true, className, children }: Props & { className?: string }) {
  if (!enabled) return <div className={className}>{children}</div>
  return (
    <ViewTransition name={name} share="foto-compartida" default="none">
      {/* Caja propia: <picture> no genera una y la transición necesita medirla. */}
      <div className={className}>{children}</div>
    </ViewTransition>
  )
}

export function SharedName({ name, enabled = true, children }: Props) {
  if (!enabled) return children
  return (
    <ViewTransition name={name} share="nombre-compartido" default="none">
      {children}
    </ViewTransition>
  )
}
