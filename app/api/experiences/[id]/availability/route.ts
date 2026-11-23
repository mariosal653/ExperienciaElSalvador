import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { findExperience, monthAvailability } from '@/lib/availability'

/**
 * GET /api/experiences/{id}/availability?month=AAAA-MM&people=N
 *
 * El mes entero del calendario del checkout, ya calculado para el grupo:
 * por cada día, su estado, las plazas libres y el total. Es orientativo:
 * la reserva vuelve a comprobar plazas y precio dentro de su transacción.
 */

export const dynamic = 'force-dynamic'

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const experience = findExperience(id)
  if (!experience || experience.booking !== 'online' || experience.priceUsd === null || experience.hidden) {
    return NextResponse.json({ ok: false, code: 'experienceNotFound' }, { status: 404 })
  }

  const url = new URL(request.url)
  const month = url.searchParams.get('month') ?? ''
  const people = Number(url.searchParams.get('people') ?? '1')
  if (!MONTH.test(month)) {
    return NextResponse.json({ ok: false, code: 'invalidMonth' }, { status: 400 })
  }
  if (!Number.isInteger(people) || people < 1 || people > experience.maxPeople) {
    return NextResponse.json({ ok: false, code: 'invalidPeople', max: experience.maxPeople }, { status: 400 })
  }

  const days = await monthAvailability(prisma, experience, month, people)
  return NextResponse.json(
    { ok: true, month, people, currency: 'USD', days },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
