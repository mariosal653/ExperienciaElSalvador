/**
 * Logotipo de Experiences in El Salvador: sol y montañas en crema sobre
 * verde profundo. Es el mismo dibujo que app/icon.svg (el favicon que
 * entregó el cliente), en línea para que no haya una petición más ni un
 * parpadeo al cargar.
 *
 * Decorativo por defecto (`aria-hidden`): siempre va junto al nombre del
 * negocio, que es lo que leen los lectores de pantalla.
 */
export const BRAND_GREEN = '#153F39'
export const BRAND_CREAM = '#FFF7EC'

export function LogoMark({ className, rounded = true }: { className?: string; rounded?: boolean }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true" focusable="false">
      <rect width="128" height="128" rx={rounded ? 29 : 0} fill={BRAND_GREEN} />
      <g transform="translate(9 9) scale(0.55)" fill="none" stroke={BRAND_CREAM} strokeLinecap="round">
        <circle cx="145" cy="54" r="22" fill={BRAND_CREAM} stroke="none" />
        <path d="M18 132 C45 99 71 91 94 115 C112 79 144 75 179 128" strokeWidth="12" strokeLinejoin="round" />
        <path d="M22 151 C55 130 81 154 103 148 C125 142 146 133 178 148" strokeWidth="12" />
        <path d="M67 170 C96 156 116 165 138 173" strokeWidth="7" />
      </g>
    </svg>
  )
}
