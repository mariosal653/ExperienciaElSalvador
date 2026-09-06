import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getWelcomeBenefit } from '@/lib/benefits'

/** Beneficio del usuario autenticado. Solo el suyo. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const benefit = await getWelcomeBenefit(session.user.id)

  return NextResponse.json({
    benefit: benefit
      ? {
          code: benefit.code,
          percentage: benefit.percentage,
          status: benefit.status,
          modalDismissed: benefit.modalDismissed,
          usedAt: benefit.usedAt,
          expiresAt: benefit.expiresAt,
        }
      : null,
  })
}
