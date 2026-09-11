import { escapeHtml } from './security'
import { formatCents } from './pricing'
import { parseLocalDate } from './data'

/**
 * Correo de confirmación con Resend (https://resend.com/docs/api-reference).
 *
 * Se usa la API HTTP con fetch: no hace falta el SDK para un solo envío.
 *
 * Variables:
 *   RESEND_API_KEY   clave de Resend. Sin ella, NO se envía nada y se deja
 *                    constancia en el log. La reserva sigue confirmada.
 *   EMAIL_FROM       remitente verificado en Resend, p. ej.
 *                    "Experience El Salvador <reservas@tu-dominio.com>".
 */

export type ConfirmationEmail = {
  to: string
  customerName: string
  bookingCode: string
  experienceTitle: string
  date: string
  people: number
  totalCents: number
  currency: string
  bookingUrl: string
  isTest: boolean
  locale: string
}

export type EmailResult = { sent: true; id: string | null } | { sent: false; reason: string }

function formatDate(iso: string, es: boolean): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  return date.toLocaleDateString(es ? 'es-SV' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function renderConfirmationEmail(data: ConfirmationEmail): { subject: string; html: string; text: string } {
  const es = data.locale === 'ES'
  const name = escapeHtml(data.customerName.split(' ')[0] ?? data.customerName)
  const title = escapeHtml(data.experienceTitle)
  const date = escapeHtml(formatDate(data.date, es))
  const total = formatCents(data.totalCents, data.currency)
  const url = escapeHtml(data.bookingUrl)
  const code = escapeHtml(data.bookingCode)

  const subject = `${data.isTest ? '[TEST] ' : ''}${es ? 'Reserva confirmada' : 'Booking confirmed'} · ${data.bookingCode}`

  const testBanner = data.isTest
    ? `<p style="background:#fdf2dc;color:#8a5d0c;padding:10px 14px;border-radius:10px;font-size:13px;margin:0 0 18px">${
        es ? 'Reserva de PRUEBA: no se realizó ningún cobro y las entradas no son válidas.' : 'TEST booking: no charge was made and the tickets are not valid for entry.'
      }</p>`
    : ''

  const html = `<!doctype html><html><body style="margin:0;background:#fbfaf7;font-family:Arial,Helvetica,sans-serif;color:#173f45">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;padding:28px" cellpadding="0" cellspacing="0"><tr><td>
<p style="font-weight:bold;font-size:18px;margin:0 0 22px">Experience <span style="color:#b8481c">El Salvador</span></p>
${testBanner}
<h1 style="font-size:24px;margin:0 0 8px">${es ? `¡Listo, ${name}!` : `You're all set, ${name}!`}</h1>
<p style="margin:0 0 22px;color:#547176">${es ? 'Tu reserva está confirmada y tus entradas están listas.' : 'Your booking is confirmed and your tickets are ready.'}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #edf0ed">
<tr><td style="padding:10px 0;color:#6a8588">${es ? 'Número de reserva' : 'Booking number'}</td><td align="right" style="padding:10px 0;font-weight:bold;font-family:monospace">${code}</td></tr>
<tr><td style="padding:10px 0;color:#6a8588">${es ? 'Experiencia' : 'Experience'}</td><td align="right" style="padding:10px 0;font-weight:bold">${title}</td></tr>
<tr><td style="padding:10px 0;color:#6a8588">${es ? 'Fecha' : 'Date'}</td><td align="right" style="padding:10px 0">${date}</td></tr>
<tr><td style="padding:10px 0;color:#6a8588">${es ? 'Viajeros' : 'Travelers'}</td><td align="right" style="padding:10px 0">${data.people}</td></tr>
<tr><td style="padding:10px 0;color:#6a8588;border-top:1px solid #edf0ed">${es ? 'Total pagado' : 'Total paid'}</td><td align="right" style="padding:10px 0;font-weight:bold;border-top:1px solid #edf0ed">${total}</td></tr>
</table>
<p style="margin:26px 0 0"><a href="${url}" style="display:inline-block;background:#b8481c;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:999px">${es ? 'Ver mis entradas' : 'View my tickets'}</a></p>
<p style="margin:18px 0 0;font-size:12px;color:#6a8588">${es ? 'Presenta el código QR de cada entrada al llegar. Guarda este correo: el enlace es tu acceso a la reserva.' : 'Show each ticket QR code on arrival. Keep this email: the link is your access to the booking.'}</p>
</td></tr></table></td></tr></table></body></html>`

  const text = [
    es ? `Reserva confirmada · ${data.bookingCode}` : `Booking confirmed · ${data.bookingCode}`,
    '',
    `${es ? 'Experiencia' : 'Experience'}: ${data.experienceTitle}`,
    `${es ? 'Fecha' : 'Date'}: ${formatDate(data.date, es)}`,
    `${es ? 'Viajeros' : 'Travelers'}: ${data.people}`,
    `${es ? 'Total pagado' : 'Total paid'}: ${total}`,
    '',
    `${es ? 'Entradas' : 'Tickets'}: ${data.bookingUrl}`,
  ].join('\n')

  return { subject, html, text }
}

export async function sendConfirmationEmail(data: ConfirmationEmail): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()

  if (!apiKey || !from) {
    console.info('[email] RESEND_API_KEY o EMAIL_FROM sin definir: confirmación no enviada', {
      booking: data.bookingCode,
    })
    return { sent: false, reason: 'notConfigured' }
  }

  const { subject, html, text } = renderConfirmationEmail(data)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [data.to], subject, html, text }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('[email] Resend rechazó el envío', { status: response.status, detail: detail.slice(0, 300) })
      return { sent: false, reason: `http${response.status}` }
    }

    const payload = (await response.json().catch(() => ({}))) as { id?: string }
    return { sent: true, id: payload.id ?? null }
  } catch (error) {
    console.error('[email] fallo de red al enviar', { message: error instanceof Error ? error.message : String(error) })
    return { sent: false, reason: 'network' }
  }
}
