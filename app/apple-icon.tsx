import { ImageResponse } from 'next/og'

/**
 * Icono para la pantalla de inicio del iPhone. iOS no acepta SVG aquí, así
 * que se genera un PNG a partir del mismo isotipo que app/icon.svg, a todo
 * color sobre crema (iOS no admite fondo transparente: lo pintaría negro).
 * Va SIN esquinas redondeadas: iOS aplica su propia máscara.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="-12 -6 222 222"><rect x="-12" y="-6" width="222" height="222" fill="#FFF7EC"/><g fill="none" stroke-linecap="round"><circle cx="145" cy="54" r="22" fill="#FFC15A"/><path d="M18 132 C45 99 71 91 94 115 C112 79 144 75 179 128" stroke="#153F39" stroke-width="12" stroke-linejoin="round"/><path d="M22 151 C55 130 81 154 103 148 C125 142 146 133 178 148" stroke="#25A99F" stroke-width="12"/><path d="M67 170 C96 156 116 165 138 173" stroke="#153F39" stroke-width="7"/></g></svg>`

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(SVG).toString('base64')}`
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={180} height={180} alt="" />,
    size,
  )
}
