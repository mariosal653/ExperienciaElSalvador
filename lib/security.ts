import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Utilidades de seguridad del lado del servidor.
 *
 * Nada de esto debe importarse desde un componente de cliente: usa
 * `node:crypto` y trabaja con secretos.
 */

/** Token aleatorio en base64url. 32 bytes = 256 bits. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/**
 * Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L): el número de reserva
 * se dicta por teléfono y se copia a mano.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function randomCode(length: number): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    // 256 no es múltiplo de 31: el sesgo es mínimo y aquí irrelevante (el
    // código no es un secreto; el secreto es el accessToken).
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return out
}

/** Número de reserva visible: EES-7K3M9P */
export function newBookingCode(): string {
  return `EES-${randomCode(6)}`
}

/** Compara dos cadenas en tiempo constante. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** HMAC-SHA256 en hexadecimal. */
export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
}

/**
 * Caracteres de control e invisibles (C0, DEL, C1, espacios de ancho cero,
 * marcas de dirección y separadores de línea Unicode). Se construye por
 * código de carácter para que el archivo fuente no contenga ninguno.
 */
const INVISIBLE_CHARS = new RegExp(
  '[' +
    [[0x00, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x2029]]
      .map(([from, to]) => String.fromCharCode(from) + '-' + String.fromCharCode(to))
      .join('') +
    ']',
  'g',
)

/**
 * Limpia texto libre escrito por el cliente.
 *
 * React ya escapa al renderizar, pero estos datos también acaban en
 * correos HTML y en el panel de la pasarela: se quitan caracteres de
 * control y signos de etiqueta, y se colapsan los espacios.
 */
export function sanitizeText(value: string, max = 120): string {
  return value
    .normalize('NFC')
    .replace(INVISIBLE_CHARS, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** Teléfono: conserva «+» inicial y dígitos. */
export function sanitizePhone(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  return (trimmed.startsWith('+') ? '+' : '') + digits
}

/** Escapa texto para insertarlo en HTML (correos). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
