/**
 * Isotipo de Experiences in El Salvador: sol, montañas, mar y orilla.
 * Va SIN recuadro, suelto junto al nombre, como el de Airbnb: el dibujo
 * se integra con la cabecera en lugar de ser una tarjeta pegada encima.
 *
 * Dos versiones del mismo dibujo:
 *   tone="color"   (por defecto) a todo color, para fondos claros: montaña
 *                  y orilla en verde profundo, mar turquesa, sol dorado.
 *   tone="onDark"  para fondos oscuros (cabeceras verdes o de vidrio): el
 *                  verde profundo no se vería, así que pasa a crema; sol y
 *                  mar conservan su color.
 *
 * Es el mismo dibujo que app/icon.svg y app/apple-icon.tsx. Va en línea
 * para que no haya una petición más ni un parpadeo al cargar. El viewBox
 * recorta el lienzo original de 240 al dibujo, así que la altura manda y
 * el ancho sale solo (`h-9 w-auto`).
 *
 * Decorativo por defecto (`aria-hidden`): siempre va junto al nombre del
 * negocio, que es lo que leen los lectores de pantalla.
 */
export const BRAND_GREEN = '#153F39'
export const BRAND_TEAL = '#25A99F'
export const BRAND_SUN = '#FFC15A'
export const BRAND_CREAM = '#FFF7EC'

/** Recorte del dibujo dentro de su lienzo, con margen para el grosor del trazo. */
export const LOGO_VIEWBOX = '10 26 178 156'

export function LogoMark({ className, tone = 'color' }: { className?: string; tone?: 'color' | 'onDark' }) {
  const ink = tone === 'onDark' ? BRAND_CREAM : BRAND_GREEN
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <LogoPaths ink={ink} />
    </svg>
  )
}

/** Los trazos del isotipo, para reutilizarlos dentro de otro SVG. */
export function LogoPaths({ ink = BRAND_GREEN }: { ink?: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <circle cx="145" cy="54" r="22" fill={BRAND_SUN} stroke="none" />
      <path d="M18 132 C45 99 71 91 94 115 C112 79 144 75 179 128" stroke={ink} strokeWidth="12" strokeLinejoin="round" />
      <path d="M22 151 C55 130 81 154 103 148 C125 142 146 133 178 148" stroke={BRAND_TEAL} strokeWidth="12" />
      <path d="M67 170 C96 156 116 165 138 173" stroke={ink} strokeWidth="7" />
    </g>
  )
}
