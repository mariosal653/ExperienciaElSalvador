'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BadgeCheck, Ban, CircleSlash, Compass, KeyRound, Loader2, TicketCheck } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { LanguageSwitch } from '@/components/i18n/language-switch'
import { parseLocalDate } from '@/lib/data'
import type { TicketValidity } from '@/lib/tickets'

type TicketInfo = {
  code: string
  number: number
  people: number
  experienceTitle: string
  date: string
  usedAt: string | null
  isTest: boolean
}

const KEY_STORAGE = 'ees:staff-key'

export function TicketValidation({
  token,
  status,
  ticket,
  staffEnabled,
}: {
  token: string
  status: TicketValidity
  ticket: TicketInfo | null
  staffEnabled: boolean
}) {
  const { lang, setLang } = useLanguage()
  const es = lang === 'ES'
  const t = (es_: string, en: string) => (es ? es_ : en)
  const router = useRouter()

  const [staffOpen, setStaffOpen] = useState(false)
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error' | 'warn'; text: string } | null>(null)
  const [confirmOtherDate, setConfirmOtherDate] = useState(false)

  // La clave del personal dura lo que la pestaña: no se queda guardada en
  // el dispositivo de nadie.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY_STORAGE)
      if (stored) setKey(stored)
    } catch {
      // Almacenamiento bloqueado.
    }
  }, [])

  const STATUS = {
    ACTIVE: { label: t('ACTIVA', 'ACTIVE'), hint: t('Entrada válida. Aún no se ha usado.', 'Valid ticket. Not used yet.'), icon: BadgeCheck, className: 'bg-[#e3f0e9] text-[#256b54] border-[#a4cdbc]' },
    USED: { label: t('USADA', 'USED'), hint: t('Esta entrada ya se utilizó.', 'This ticket has already been used.'), icon: TicketCheck, className: 'bg-[#eef1f0] text-[#50686b] border-[#cfd9d6]' },
    CANCELLED: { label: t('CANCELADA', 'CANCELLED'), hint: t('Esta entrada fue cancelada.', 'This ticket was cancelled.'), icon: Ban, className: 'bg-[#fae6e0] text-[#a3341c] border-[#e3b3a4]' },
    INVALID: { label: t('NO VÁLIDA', 'INVALID'), hint: t('No reconocemos esta entrada.', 'We do not recognise this ticket.'), icon: CircleSlash, className: 'bg-[#fae6e0] text-[#a3341c] border-[#e3b3a4]' },
  }[status]
  const Icon = STATUS.icon

  const dateLabel = ticket
    ? parseLocalDate(ticket.date)?.toLocaleDateString(es ? 'es-SV' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  async function redeem(allowOtherDate = false) {
    setLoading(true)
    setMessage(null)
    try {
      try {
        sessionStorage.setItem(KEY_STORAGE, key)
      } catch {
        // Sin almacenamiento.
      }
      const response = await fetch(`/api/tickets/${token}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-validation-key': key },
        body: JSON.stringify({ allowOtherDate }),
      })
      const payload = await response.json().catch(() => ({}))

      if (response.ok) {
        setMessage({ tone: 'ok', text: t('Entrada marcada como usada.', 'Ticket marked as used.') })
        setConfirmOtherDate(false)
        router.refresh()
      } else if (payload.code === 'wrongDate') {
        setConfirmOtherDate(true)
        setMessage({ tone: 'warn', text: t(`Esta entrada es para el ${payload.ticketDate}, no para hoy.`, `This ticket is for ${payload.ticketDate}, not today.`) })
      } else {
        const text: Record<string, string> = {
          unauthorized: t('Clave de personal incorrecta.', 'Wrong staff key.'),
          alreadyUsed: t('Esta entrada ya se había usado.', 'This ticket was already used.'),
          cancelled: t('La entrada está cancelada.', 'The ticket is cancelled.'),
          testTicket: t('Entrada de prueba: no válida.', 'Test ticket: not valid.'),
          bookingNotConfirmed: t('La reserva no está confirmada.', 'The booking is not confirmed.'),
          validationDisabled: t('La validación no está configurada en el servidor.', 'Validation is not configured on the server.'),
          tooManyRequests: t('Demasiados intentos. Espera un minuto.', 'Too many attempts. Wait a minute.'),
        }
        setMessage({ tone: 'error', text: text[payload.code] ?? t('No se pudo validar.', 'Could not validate.') })
        if (payload.code === 'alreadyUsed') router.refresh()
      }
    } catch {
      setMessage({ tone: 'error', text: t('Sin conexión.', 'No connection.') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#173f45]">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4b942] text-[#173f45]">
              <Compass size={18} strokeWidth={2.5} />
            </span>
            Experience <span className="text-[#b8481c]">El Salvador</span>
          </span>
          <div className="rounded-full bg-[#173f45] p-0.5">
            <LanguageSwitch lang={lang} onChange={setLang} />
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.1)]">
          <div className={`flex flex-col items-center gap-2 border-b px-6 py-8 text-center ${STATUS.className}`} role="status">
            <Icon size={52} />
            <p className="text-3xl font-bold tracking-wide">{STATUS.label}</p>
            <p className="text-sm">{STATUS.hint}</p>
          </div>

          {ticket && (
            <dl className="grid gap-3 p-6 text-sm">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-[#759096]">{t('Experiencia', 'Experience')}</dt>
                <dd className="mt-0.5 text-base font-semibold">{ticket.experienceTitle}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-[#759096]">{t('Fecha', 'Date')}</dt>
                <dd className="mt-0.5 capitalize">{dateLabel}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-[#759096]">{t('ID de entrada', 'Ticket ID')}</dt>
                  <dd className="mt-0.5 break-all font-mono">{ticket.code}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-[#759096]">{t('Viajero', 'Traveler')}</dt>
                  <dd className="mt-0.5">{ticket.number} / {ticket.people}</dd>
                </div>
              </div>
              {ticket.usedAt && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-[#759096]">{t('Usada el', 'Used on')}</dt>
                  <dd className="mt-0.5">{new Date(ticket.usedAt).toLocaleString(es ? 'es-SV' : 'en-US', { timeZone: 'America/El_Salvador' })}</dd>
                </div>
              )}
              {ticket.isTest && (
                <p className="flex items-center gap-2 rounded-xl bg-[#fdf2dc] px-3 py-2 text-xs font-semibold text-[#8a5d0c]">
                  <AlertTriangle size={14} /> {t('Entrada de una reserva de prueba.', 'Ticket from a test booking.')}
                </p>
              )}
            </dl>
          )}
        </section>

        {/* Personal */}
        {staffEnabled && status === 'ACTIVE' && (
          <section className="mt-5 rounded-3xl border border-[#dce7e1] bg-white p-5">
            {!staffOpen ? (
              <button type="button" onClick={() => setStaffOpen(true)} className="flex w-full items-center justify-center gap-2 text-sm font-bold text-[#173f45]">
                <KeyRound size={16} /> {t('Soy del personal: validar entrada', 'Staff: validate ticket')}
              </button>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  redeem(false)
                }}
                className="grid gap-3"
              >
                <label htmlFor="staff-key" className="text-sm font-semibold">{t('Clave de validación', 'Validation key')}</label>
                <input
                  id="staff-key"
                  type="password"
                  autoComplete="off"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  className="w-full rounded-xl border border-[#dce7e1] px-3.5 py-3 text-base outline-none focus:border-[#173f45]"
                />
                <button
                  type="submit"
                  disabled={loading || !key}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#173f45] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />} {t('Marcar como usada', 'Mark as used')}
                </button>
                {confirmOtherDate && (
                  <button
                    type="button"
                    onClick={() => redeem(true)}
                    disabled={loading}
                    className="rounded-full border border-[#e2c483] bg-[#fdf2dc] px-5 py-3 text-sm font-bold text-[#8a5d0c]"
                  >
                    {t('Validar igualmente', 'Validate anyway')}
                  </button>
                )}
              </form>
            )}
          </section>
        )}

        {message && (
          <p
            role="alert"
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              message.tone === 'ok' ? 'bg-[#e3f0e9] text-[#256b54]' : message.tone === 'warn' ? 'bg-[#fdf2dc] text-[#8a5d0c]' : 'bg-[#fae6e0] text-[#a3341c]'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </main>
  )
}
