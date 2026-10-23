'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  MapPin,
  Printer,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { formatCents } from '@/lib/pricing'
import { experienceNameById, parseLocalDate } from '@/lib/data'
import { trackPurchase } from '@/lib/analytics'
import { formatDeadline } from '@/lib/pay-later'

type BookingData = {
  code: string
  status: string
  experienceId: string
  experienceTitle: string
  experienceImage: string | null
  destination: string
  date: string
  people: number
  unitPriceCents: number
  subtotalCents: number
  discountCents: number
  totalCents: number
  currency: string
  customerName: string
  customerEmail: string
  isTest: boolean
  holdExpiresAt: string | null
  payLater: boolean
  emailSent: boolean
}

/** Pasarelas disponibles, decididas en el servidor (sin claves). */
type Methods = {
  wompi: { available: boolean; mode: string | null }
  paypal: { available: boolean; mode: string | null }
  any: boolean
}

type TicketData = {
  code: string
  number: number
  status: string
  usedAt: string | null
  url: string
  qrSvg: string
}

/** Cada cuánto se consulta el estado mientras el pago se procesa. */
const POLL_MS = 4000
/** Y durante cuánto tiempo, como máximo. */
const POLL_LIMIT_MS = 3 * 60_000

export function BookingView({
  booking,
  payment,
  paymentMode,
  methods,
  tickets,
}: {
  booking: BookingData
  payment: { status: string; checkoutUrl: string | null; failureReason: string | null } | null
  paymentMode: string | null
  methods: Methods
  tickets: TicketData[]
}) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const t = (es_: string, en: string) => (es ? es_ : en)
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [pollExpired, setPollExpired] = useState(false)

  const confirmed = booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
  // «Reserva ahora, paga después» con el plazo vigente: se muestra su propio
  // bloque (pagar o liberar) en lugar del de «pago en curso».
  const heldForLater =
    booking.payLater &&
    booking.status === 'PENDING_PAYMENT' &&
    booking.holdExpiresAt !== null &&
    new Date(booking.holdExpiresAt).getTime() > Date.now()
  const pending = (booking.status === 'PENDING_PAYMENT' || booking.status === 'PAID') && !heldForLater
  const declined = booking.status === 'PENDING_PAYMENT' && payment?.status === 'DECLINED' && !heldForLater
  const cancelled = booking.status === 'CANCELLED'

  const [paying, setPaying] = useState<'wompi' | 'paypal' | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function payNow(method: 'wompi' | 'paypal') {
    setPaying(method)
    setActionError(null)
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(accessTokenFromUrl())}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, locale: lang }),
      })
      const payload = await response.json().catch(() => ({}))
      if (response.ok && payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl)
        return
      }
      if (payload.code === 'notPayable') {
        router.refresh()
      }
      setActionError(
        payload.code === 'notPayable'
          ? t('Esta reserva ya no se puede pagar: se pagó, se canceló o venció el plazo.', 'This booking can no longer be paid: it was paid, cancelled or the deadline passed.')
          : t('No pudimos abrir la página de pago. Inténtalo de nuevo en un momento.', 'We could not open the payment page. Please try again in a moment.'),
      )
    } catch {
      setActionError(t('Sin conexión. Revisa tu internet e inténtalo de nuevo.', 'No connection. Check your internet and try again.'))
    }
    setPaying(null)
  }

  async function release() {
    const ok = window.confirm(
      t('¿Liberar tu reserva? Las plazas quedarán disponibles para otros viajeros. No se cobra nada.', 'Release your booking? The spots will become available to other travelers. Nothing is charged.'),
    )
    if (!ok) return
    setReleasing(true)
    setActionError(null)
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(accessTokenFromUrl())}/cancel`, { method: 'POST' })
      if (!response.ok) throw new Error('cancel')
      router.refresh()
    } catch {
      setActionError(t('No pudimos liberar la reserva. Inténtalo de nuevo o escríbenos por WhatsApp.', 'We could not release the booking. Try again or message us on WhatsApp.'))
    }
    setReleasing(false)
  }

  // Analítica: la compra se cuenta cuando la reserva queda confirmada.
  // trackPurchase evita contarla dos veces si se vuelve a abrir la página.
  useEffect(() => {
    if (confirmed) trackPurchase(booking)
  }, [confirmed, booking])

  // Mientras el pago se procesa (webhook en camino), refresca la página.
  useEffect(() => {
    if (!pending || declined) return
    const started = Date.now()
    const timer = window.setInterval(() => {
      if (Date.now() - started > POLL_LIMIT_MS) {
        window.clearInterval(timer)
        setPollExpired(true)
        return
      }
      router.refresh()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [pending, declined, router])

  const dateLabel =
    parseLocalDate(booking.date)?.toLocaleDateString(es ? 'es-SV' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) ?? booking.date

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Sin permiso de portapapeles: no pasa nada, el enlace está en la barra.
    }
  }

  const testNotice = booking.isTest
    ? t(
        'Reserva de PRUEBA: no se realizó ningún cobro y estas entradas no son válidas para entrar.',
        'TEST booking: no charge was made and these tickets are not valid for entry.',
      )
    : null

  return (
    <div className="min-h-screen bg-cream text-brand">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-5 lg:px-8">
        {testNotice && (
          <p className="mb-5 flex items-start gap-2 rounded-xl border border-gold-line bg-gold-pale px-4 py-3 text-sm font-medium text-gold-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {testNotice}
          </p>
        )}

        {/* Estado */}
        {confirmed && (
          <section className="rounded-3xl border border-success-line bg-success-soft p-6 text-center sm:p-10">
            <CheckCircle2 size={48} className="mx-auto text-success-dark" />
            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{t('Reserva confirmada', 'Booking confirmed')}</h1>
            <p className="mt-2 text-sm text-success-dark">
              {t('Número de reserva', 'Booking number')}{' '}
              <strong className="font-mono text-base text-brand">{booking.code}</strong>
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-success-dark">
              {booking.emailSent
                ? t(`Te enviamos la confirmación a ${booking.customerEmail}.`, `We sent the confirmation to ${booking.customerEmail}.`)
                : t('Guarda el enlace de esta página: es tu acceso a las entradas.', 'Save this page link — it is your access to the tickets.')}
            </p>
            <div className="no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#tickets"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <Ticket size={16} /> {t('Ver entradas', 'View Tickets')}
              </a>
              <Link
                href="/#experiencias"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-success-line bg-white px-6 py-3 text-sm font-bold text-brand transition hover:bg-surface-soft"
              >
                {t('Volver a experiencias', 'Back to Experiences')}
              </Link>
            </div>
          </section>
        )}

        {heldForLater && (
          <section className="rounded-3xl border border-gold-line bg-gold-pale p-6 text-center sm:p-10">
            <CalendarClock size={46} className="mx-auto text-accent" />
            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{t('Tu lugar está apartado', 'Your spot is held')}</h1>
            <p className="mt-2 text-sm text-gold-ink">
              {t('Número de reserva', 'Booking number')}{' '}
              <strong className="font-mono text-base text-brand">{booking.code}</strong>
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-gold-ink">
              {t('Aún no se ha cobrado nada. Plazo para pagar:', 'Nothing has been charged yet. Pay before:')}
            </p>
            <p className="mt-1 text-base font-bold capitalize text-brand">
              {formatDeadline(new Date(booking.holdExpiresAt as string), lang)}
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-gold-ink">
              {t('Si no pagas a tiempo, la reserva vence sola y las plazas se liberan, sin ningún cargo.', 'If you do not pay in time, the booking expires on its own and the spots are released, with no charge.')}
            </p>
            {payment?.status === 'DECLINED' && (
              <p className="mx-auto mt-3 max-w-md text-xs font-semibold text-accent-deep">
                {t('El último intento de pago no se completó. Puedes intentarlo otra vez.', 'Your last payment attempt did not go through. You can try again.')}
              </p>
            )}

            <div className="no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {methods.wompi.available && (
                <button
                  onClick={() => payNow('wompi')}
                  disabled={paying !== null || releasing}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60"
                >
                  {paying === 'wompi' ? <Loader2 size={16} className="animate-spin" /> : null}
                  {methods.wompi.mode === 'mock'
                    ? t('Pagar ahora (prueba)', 'Pay now (test)')
                    : t('Pagar ahora con tarjeta', 'Pay now by card')}{' '}
                  <ArrowRight size={16} />
                </button>
              )}
              {methods.paypal.available && (
                <button
                  onClick={() => payNow('paypal')}
                  disabled={paying !== null || releasing}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand bg-white px-6 py-3 text-sm font-bold text-brand transition hover:bg-surface-soft disabled:opacity-60"
                >
                  {paying === 'paypal' ? <Loader2 size={16} className="animate-spin" /> : null}
                  {t('Pagar con PayPal', 'Pay with PayPal')}
                </button>
              )}
            </div>
            {!methods.any && (
              <p className="mt-4 text-xs font-medium text-accent-deep">
                {t('El pago en línea no está disponible en este momento. Escríbenos por WhatsApp y te ayudamos.', 'Online payment is unavailable right now. Message us on WhatsApp and we will help.')}
              </p>
            )}

            <button
              onClick={release}
              disabled={paying !== null || releasing}
              className="no-print mt-5 text-xs font-bold text-muted underline underline-offset-4 hover:text-accent-deep disabled:opacity-60"
            >
              {releasing ? t('Liberando…', 'Releasing…') : t('Ya no puedo ir: liberar mi reserva', "I can't make it: release my booking")}
            </button>

            {actionError && (
              <p role="alert" className="mx-auto mt-4 max-w-md text-sm font-medium text-accent-deep">{actionError}</p>
            )}
          </section>
        )}

        {pending && !declined && (
          <section className="rounded-3xl border border-line bg-white p-6 text-center sm:p-10" aria-live="polite">
            {pollExpired ? <Clock size={44} className="mx-auto text-accent" /> : <Loader2 size={44} className="mx-auto animate-spin text-brand" />}
            <h1 className="mt-4 text-2xl font-semibold">
              {pollExpired ? t('Aún no recibimos la confirmación del pago', 'We have not received the payment confirmation yet') : t('Pago pendiente', 'Payment pending')}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {pollExpired
                ? t('Si ya pagaste, la confirmación llegará a tu correo en cuanto la pasarela nos avise. Si no terminaste el pago, puedes completarlo ahora.', 'If you already paid, the confirmation will reach your email as soon as the gateway notifies us. If you did not finish paying, you can complete it now.')
                : t('Si acabas de pagar, esta página se actualiza sola en unos segundos. Si todavía no lo hiciste, completa el pago: tus plazas quedan apartadas 30 minutos.', 'If you have just paid, this page updates by itself in a few seconds. If you have not paid yet, complete the payment — your spots are held for 30 minutes.')}
            </p>
            {payment?.checkoutUrl && booking.status === 'PENDING_PAYMENT' && (
              <a
                href={payment.checkoutUrl}
                className="no-print mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark"
              >
                {t('Completar el pago', 'Complete payment')} <ArrowRight size={16} />
              </a>
            )}
          </section>
        )}

        {declined && (
          <section className="rounded-3xl border border-accent-line bg-accent-soft p-6 text-center sm:p-10" role="alert">
            <XCircle size={44} className="mx-auto text-accent-deep" />
            <h1 className="mt-4 text-2xl font-semibold">{t('El pago no se completó', 'The payment did not go through')}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-accent-deep">
              {t('No se hizo ningún cargo. Puedes intentarlo otra vez con la misma u otra tarjeta.', 'You have not been charged. You can try again with the same or another card.')}
            </p>
            <div className="no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {payment?.checkoutUrl && (
                <a href={payment.checkoutUrl} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark">
                  {t('Intentar de nuevo', 'Try again')} <ArrowRight size={16} />
                </a>
              )}
              <Link href={`/checkout/${booking.experienceId}`} className="inline-flex items-center justify-center rounded-full border border-accent-line bg-white px-6 py-3 text-sm font-bold text-brand">
                {t('Empezar de nuevo', 'Start over')}
              </Link>
            </div>
          </section>
        )}

        {cancelled && (
          <section className="rounded-3xl border border-line bg-white p-6 text-center sm:p-10">
            <XCircle size={44} className="mx-auto text-muted" />
            <h1 className="mt-4 text-2xl font-semibold">{t('Esta reserva no está activa', 'This booking is not active')}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              {booking.payLater
                ? t('La reserva se liberó o venció el plazo para pagarla, sin ningún cargo. Puedes reservar de nuevo.', 'The booking was released or its payment deadline passed, with no charge. You can book again.')
                : t('El pago no se completó a tiempo o la reserva se canceló. Puedes reservar de nuevo.', 'The payment was not completed in time or the booking was cancelled. You can book again.')}
            </p>
            <Link href={`/checkout/${booking.experienceId}`} className="no-print mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white">
              {t('Reservar de nuevo', 'Book again')} <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* Detalle */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-card" aria-labelledby="details-title">
          <div className="flex flex-col sm:flex-row">
            {booking.experienceImage && (
              <img src={booking.experienceImage} alt="" decoding="async" className="h-44 w-full object-cover sm:h-auto sm:w-56 sm:shrink-0" />
            )}
            <div className="min-w-0 flex-1 p-5 sm:p-6">
              <h2 id="details-title" className="text-xl font-semibold">{experienceNameById(booking.experienceId, lang) ?? booking.experienceTitle}</h2>
              <ul className="mt-3 grid gap-2 text-sm text-muted">
                <li className="flex items-center gap-2"><MapPin size={15} className="shrink-0" /> {booking.destination}</li>
                <li className="flex items-center gap-2 capitalize"><CalendarDays size={15} className="shrink-0" /> {dateLabel}</li>
                <li className="flex items-center gap-2">
                  <Users size={15} className="shrink-0" /> {booking.people} {es ? (booking.people === 1 ? 'viajero' : 'viajeros') : booking.people === 1 ? 'traveler' : 'travelers'}
                </li>
              </ul>
              <dl className="mt-4 grid gap-1.5 border-t border-line-soft pt-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">{formatCents(booking.unitPriceCents, booking.currency)} × {booking.people}</dt><dd>{formatCents(booking.subtotalCents, booking.currency)}</dd></div>
                {booking.discountCents > 0 && (
                  <div className="flex justify-between gap-3 text-success-dark"><dt>{t('Descuento', 'Discount')}</dt><dd>−{formatCents(booking.discountCents, booking.currency)}</dd></div>
                )}
                <div className="flex justify-between gap-3 font-semibold">
                  <dt>{confirmed ? t('Total pagado', 'Total paid') : 'Total'}</dt>
                  <dd className="text-lg">{formatCents(booking.totalCents, booking.currency)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                {t('A nombre de', 'Booked by')} <strong className="text-brand">{booking.customerName}</strong> · <span className="font-mono">{booking.code}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Entradas */}
        {confirmed && (
          <section id="tickets" className="mt-8 scroll-mt-6" aria-labelledby="tickets-title">
            <div className="no-print flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="tickets-title" className="text-xl font-semibold">{t('Tus entradas', 'Your tickets')}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t('Una por viajero. Presenta cada código QR al llegar.', 'One per traveler. Show each QR code on arrival.')}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold transition hover:bg-surface-mint">
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t('Copiado', 'Copied') : t('Copiar enlace', 'Copy link')}
                </button>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold transition hover:bg-surface-mint">
                  <Printer size={14} /> {t('Imprimir', 'Print')}
                </button>
              </div>
            </div>

            {tickets.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-line-strong bg-white p-6 text-sm text-muted">
                {t('Estamos generando tus entradas. Recarga la página en unos segundos.', 'We are generating your tickets. Reload the page in a few seconds.')}
              </p>
            ) : (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {tickets.map((ticket) => (
                  <li key={ticket.code} className="print-ticket overflow-hidden rounded-3xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-3 bg-brand px-5 py-3 text-white">
                      <span className="text-sm font-bold">Experiences <span className="text-gold">El Salvador</span></span>
                      <TicketStatus status={ticket.status} es={es} />
                    </div>
                    <div className="grid gap-4 p-5 min-[420px]:grid-cols-[auto_1fr] min-[420px]:items-center">
                      <div
                        className={`mx-auto w-40 max-w-full rounded-xl border border-line-soft p-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${ticket.status !== 'ACTIVE' ? 'opacity-40' : ''}`}
                        role="img"
                        aria-label={t(`Código QR de la entrada ${ticket.code}`, `QR code for ticket ${ticket.code}`)}
                        // SVG generado en el servidor por la librería qrcode a
                        // partir de nuestra propia URL: no contiene datos del cliente.
                        dangerouslySetInnerHTML={{ __html: ticket.qrSvg }}
                      />
                      <div className="min-w-0 text-center min-[420px]:text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-faint">
                          {t('Viajero', 'Traveler')} {ticket.number} {t('de', 'of')} {booking.people}
                        </p>
                        <p className="mt-1 font-semibold leading-snug">{booking.experienceTitle}</p>
                        <p className="mt-1 text-sm capitalize text-muted">{dateLabel}</p>
                        <p className="mt-2 break-all font-mono text-xs text-muted">{ticket.code}</p>
                        {booking.isTest && <p className="mt-2 text-[11px] font-bold uppercase text-gold-ink">{t('Prueba · no válida', 'Test · not valid')}</p>}
                        <a href={ticket.url} target="_blank" rel="noopener" className="no-print mt-2 inline-block text-xs font-bold text-accent hover:underline">
                          {t('Abrir entrada', 'Open ticket')}
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {paymentMode === 'mock' && pending && (
          <p className="no-print mt-6 text-center text-xs text-muted">
            {t('Modo de prueba activo: el pago se completa en la pasarela simulada.', 'Test mode is on: payment is completed on the simulated gateway.')}
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

/** La llave de acceso es el último segmento de /booking/<accessToken>. */
function accessTokenFromUrl(): string {
  return window.location.pathname.split('/').filter(Boolean).pop() ?? ''
}

function TicketStatus({ status, es }: { status: string; es: boolean }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: es ? 'Activa' : 'Active', className: 'bg-success-soft text-success-dark' },
    USED: { label: es ? 'Usada' : 'Used', className: 'bg-white/20 text-white' },
    CANCELLED: { label: es ? 'Cancelada' : 'Cancelled', className: 'bg-accent-soft text-accent-deep' },
  }
  const item = map[status] ?? map.ACTIVE
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.className}`}>{item.label}</span>
}
