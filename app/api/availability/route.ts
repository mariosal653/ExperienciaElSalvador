import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkBookableDate, findExperience, seatsFor } from '@/lib/availability'

/**
 * GET /api/availability?experienceId=…&date=AAAA-MM-DD
 *
 * Plazas libres de una salida. Lo usa el checkout para limitar el número
 * de viajeros. Es orientativo: la comprobación que cuenta se repite dentro
 * de la transacción que crea la reserva.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const experience = findExperience(url.searchParams.get('experienceId') ?? '')
  const date = url.searchParams.get('date') ?? ''

  if (!experience) return NextResponse.json({ ok: false, code: 'experienceNotFound' }, { status: 404 })

  const check = checkBookableDate(experience, date)
  if (!check.ok) return NextResponse.json({ ok: true, available: false, reason: check.reason, remaining: 0 })

  const seats = await seatsFor(prisma, experience, date)
  return NextResponse.json(
    { ok: true, available: seats.remaining > 0, remaining: seats.remaining, capacity: seats.capacity },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
