import { ImageResponse } from 'next/og'

/**
 * Icono para la pantalla de inicio del iPhone. iOS no acepta SVG aquí, así
 * que se genera un PNG a partir del mismo dibujo que app/icon.svg. Va SIN
 * esquinas redondeadas: iOS aplica su propia máscara y, con las nuestras,
 * quedaría un borde claro en las esquinas.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 128 128"><rect width="128" height="128" fill="#153F39"/><g transform="translate(9 9) scale(0.55)" fill="none" stroke="#FFF7EC" stroke-linecap="round"><circle cx="145" cy="54" r="22" fill="#FFF7EC" stroke="none"/><path d="M18 132 C45 99 71 91 94 115 C112 79 144 75 179 128" stroke-width="12" stroke-linejoin="round"/><path d="M22 151 C55 130 81 154 103 148 C125 142 146 133 178 148" stroke-width="12"/><path d="M67 170 C96 156 116 165 138 173" stroke-width="7"/></g></svg>`

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(SVG).toString('base64')}`
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={180} height={180} alt="" />,
    size,
  )
}
