'use client'

import { useState } from 'react'
import { MapPin, Users, Ticket, Loader2, Star } from 'lucide-react'
import { parseLocalDate } from '@/lib/data'

type BookingView = {
  id: string
  code: string
  title: string
  image: string | null
  destination: string
  date: string
  people: number
  status: string
  total: string
  discountCents: number
  hasReview: boolean
  /** Enlace a la reserva y sus entradas. */
  href: string
  isTest?: boolean
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: 'Pago pendiente', className: 'bg-[#fdf2dc] text-[#8a5d0c] border-[#e2c483]' },
  PAID: { label: 'Pagada', className: 'bg-[#e0eef1] text-[#1d5966] border-[#a8ccd4]' },
  CONFIRMED: { label: 'Confirmada', className: 'bg-[#e0eef1] text-[#1d5966] border-[#a8ccd4]' },
  COMPLETED: { label: 'Completada', className: 'bg-[#e3f0e9] text-[#256b54] border-[#a4cdbc]' },
  CANCELLED: { label: 'Cancelada', className: 'bg-[#fae6e0] text-[#a3341c] border-[#e3b3a4]' },
}

function formatDate(iso: string): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  return date.toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BookingCard({ booking }: { booking: BookingView }) {
  const status = STATUS_STYLE[booking.status] ?? STATUS_STYLE.CONFIRMED
  const [reviewOpen, setReviewOpen] = useState(false)

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-white">
      <div className="flex flex-col sm:flex-row">
        {booking.image ? (
          <img
            src={booking.image}
            alt=""
            className="h-40 w-full object-cover sm:h-auto sm:w-44 sm:shrink-0"
          />
        ) : (
          <div className="h-40 w-full bg-[#eaf1ed] sm:h-auto sm:w-44 sm:shrink-0" />
        )}

        <div className="flex-1 p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
              {status.label}
            </span>
            <span className="font-mono text-[11px] text-[#6a8588]">{booking.code}</span>
            {booking.isTest && (
              <span className="rounded-full bg-[#eef1f0] px-2.5 py-1 text-[11px] font-bold text-[#50686b]">Prueba</span>
            )}
            {booking.discountCents > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[#f4d27c] px-2.5 py-1 text-[11px] font-bold text-[#173f45]">
                <Ticket size={11} /> 25% aplicado
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-[#173f45]">{booking.title}</h3>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6a8588]">
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {booking.destination}
            </span>
            <span>{formatDate(booking.date)}</span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {booking.people} {booking.people === 1 ? 'persona' : 'personas'}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ed] pt-3">
            <span className="text-sm">
              <span className="text-xs text-[#6a8588]">Total </span>
              <strong className="text-lg text-[#173f45]">{booking.total}</strong>
            </span>

            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT') && (
              <a
                href={booking.href}
                className="flex items-center gap-1.5 rounded-full border border-[#dce7e1] px-4 py-2 text-xs font-bold text-[#173f45] transition hover:bg-[#eaf1ed]"
              >
                <Ticket size={13} />
                {booking.status === 'CONFIRMED' ? 'Ver entradas' : 'Completar pago'}
              </a>
            )}

            {booking.status === 'COMPLETED' && !booking.hasReview && (
              <button
                type="button"
                onClick={() => setReviewOpen((value) => !value)}
                className="flex items-center gap-1.5 rounded-full bg-[#b8481c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#963b18]"
              >
                <Star size={13} />
                Dejar opinión
              </button>
            )}

            {booking.hasReview && (
              <span className="text-xs font-semibold text-[#256b54]">Opinión enviada</span>
            )}
          </div>

          {reviewOpen && <ReviewForm bookingId={booking.id} onDone={() => setReviewOpen(false)} />}
        </div>
      </div>
    </article>
  )
}

/** Formulario de opinión. Solo aparece en reservas completadas. */
function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setError(
          payload.error === 'bookingNotCompleted'
            ? 'Solo puedes opinar sobre experiencias completadas.'
            : payload.error === 'alreadyReviewed'
              ? 'Ya dejaste tu opinión sobre esta reserva.'
              : 'No se pudo enviar. Intenta de nuevo.',
        )
        setLoading(false)
        return
      }
      onDone()
      window.location.reload()
    } catch {
      setError('No se pudo enviar. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl bg-[#f4f7f5] p-4">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} de 5`}
            onClick={() => setRating(star)}
            className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-[#173f45]"
          >
            <Star
              size={20}
              className={star <= rating ? 'text-[#f4b942]' : 'text-[#c3d1cd]'}
              fill={star <= rating ? '#f4b942' : 'none'}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        maxLength={800}
        placeholder="¿Qué tal estuvo? Cuéntanos brevemente."
        className="mt-3 w-full rounded-xl border border-[#dce7e1] bg-white px-3 py-2.5 text-sm text-[#173f45] outline-none focus:border-[#173f45]"
      />

      {error && <p className="mt-2 text-xs font-medium text-[#a3341c]">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={loading || comment.trim().length < 10}
          className="flex items-center gap-2 rounded-full bg-[#173f45] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0e3035] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Publicar opinión
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-[#dce7e1] px-4 py-2 text-xs font-bold text-[#173f45] transition hover:bg-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
