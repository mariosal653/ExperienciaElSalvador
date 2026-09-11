'use client'

import { useState } from 'react'
import { CheckCircle2, FlaskConical, Loader2, XCircle } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { formatCents } from '@/lib/pricing'

export function MockPayment({
  reference,
  amountCents,
  status,
  booking,
}: {
  reference: string
  amountCents: number
  status: string
  booking: { code: string; title: string; date: string; people: number; accessToken: string }
}) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const [loading, setLoading] = useState<'approve' | 'decline' | null>(null)
  const [declined, setDeclined] = useState(status === 'DECLINED')
  const [error, setError] = useState<string | null>(null)

  async function complete(outcome: 'approve' | 'decline') {
    setLoading(outcome)
    setError(null)
    try {
      const response = await fetch('/api/payments/mock/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, outcome }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.code ?? 'error')

      if (outcome === 'approve') {
        window.location.assign(`/booking/${payload.accessToken}`)
        return
      }
      setDeclined(true)
      setLoading(null)
    } catch {
      setError(es ? 'No se pudo completar. Inténtalo de nuevo.' : 'Could not complete. Please try again.')
      setLoading(null)
    }
  }

  const alreadyPaid = status === 'APPROVED'

  return (
    <main className="grid min-h-screen place-items-center bg-[#eef2f1] px-4 py-10 text-[#173f45]">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(26,65,69,.15)]">
        <div className="flex items-center gap-2 bg-[#fdf2dc] px-5 py-3 text-sm font-bold text-[#8a5d0c]">
          <FlaskConical size={16} />
          {es ? 'Pasarela de PRUEBA — no se cobra nada' : 'TEST gateway — nothing is charged'}
        </div>

        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#759096]">
            {es ? 'Pago simulado' : 'Simulated payment'}
          </p>
          <p className="mt-2 text-4xl font-semibold">{formatCents(amountCents)}</p>
          <dl className="mt-5 grid gap-2 border-t border-[#edf0ed] pt-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-[#6a8588]">{es ? 'Reserva' : 'Booking'}</dt><dd className="font-mono font-semibold">{booking.code}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#6a8588]">{es ? 'Experiencia' : 'Experience'}</dt><dd className="text-right font-semibold">{booking.title}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#6a8588]">{es ? 'Fecha' : 'Date'}</dt><dd>{booking.date}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#6a8588]">{es ? 'Viajeros' : 'Travelers'}</dt><dd>{booking.people}</dd></div>
          </dl>

          <p className="mt-5 rounded-xl bg-[#f4f7f5] px-4 py-3 text-xs leading-relaxed text-[#547176]">
            {es
              ? 'Esta pantalla sustituye a la página de pago de Wompi mientras la integración está en modo simulado (WOMPI_ENVIRONMENT=mock). Aquí no se escriben datos de tarjeta.'
              : "This screen stands in for Wompi's payment page while the integration runs in simulated mode (WOMPI_ENVIRONMENT=mock). No card details are entered here."}
          </p>

          {declined && !alreadyPaid && (
            <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-[#fae6e0] px-4 py-3 text-sm font-medium text-[#a3341c]">
              <XCircle size={16} /> {es ? 'Pago rechazado (simulado). Puedes volver a intentarlo.' : 'Payment declined (simulated). You can try again.'}
            </p>
          )}
          {error && <p role="alert" className="mt-4 text-sm font-medium text-[#a3341c]">{error}</p>}

          {alreadyPaid ? (
            <a href={`/booking/${booking.accessToken}`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#173f45] px-6 py-3.5 text-sm font-bold text-white">
              <CheckCircle2 size={16} /> {es ? 'Ya pagado · Ver reserva' : 'Already paid · View booking'}
            </a>
          ) : (
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => complete('approve')}
                disabled={loading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#256b54] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1d5643] disabled:opacity-60"
              >
                {loading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {es ? 'Aprobar pago de prueba' : 'Approve test payment'}
              </button>
              <button
                type="button"
                onClick={() => complete('decline')}
                disabled={loading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e3b3a4] bg-white px-6 py-3.5 text-sm font-bold text-[#a3341c] transition hover:bg-[#fdf1ed] disabled:opacity-60"
              >
                {loading === 'decline' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                {es ? 'Simular rechazo' : 'Simulate decline'}
              </button>
              <a href={`/booking/${booking.accessToken}`} className="text-center text-xs font-semibold text-[#6a8588] hover:underline">
                {es ? 'Cancelar y volver' : 'Cancel and go back'}
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
