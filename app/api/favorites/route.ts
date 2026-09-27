import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { experiences } from '@/lib/data'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * Favoritos de la cuenta.
 *
 *   GET                                  → { ids }
 *   POST { experienceId, saved }         → guarda o quita una; { ids }
 *   POST { merge: [ids] }                → sube los guardados en el
 *                                          navegador antes de iniciar sesión
 *
 * Siempre sobre el usuario de la SESIÓN. Solo se aceptan ids del catálogo.
 */

export const dynamic = 'force-dynamic'

const CATALOG = new Set(experiences.map((item) => item.id))
const experienceId = z.string().refine((id) => CATALOG.has(id), 'unknownExperience')

const bodySchema = z.union([
  z.object({ experienceId, saved: z.boolean() }),
  z.object({ merge: z.array(z.string()).max(50) }),
])

async function listIds(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { experienceId: true },
  })
  // Una experiencia retirada del catálogo deja de mostrarse.
  return rows.map((row) => row.experienceId).filter((id) => CATALOG.has(id))
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  return NextResponse.json({ ids: await listIds(session.user.id) })
}

export async function POST(request: Request) {
  const limit = rateLimit(`favorites:${clientIp(request)}`, 60, 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'tooManyRequests' }, { status: 429 })

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalidBody' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'validation' }, { status: 422 })

  if ('merge' in parsed.data) {
    // upsert uno a uno: SQLite no admite createMany con skipDuplicates.
    for (const id of parsed.data.merge.filter((value) => CATALOG.has(value))) {
      await prisma.favorite.upsert({
        where: { userId_experienceId: { userId, experienceId: id } },
        create: { userId, experienceId: id },
        update: {},
      })
    }
  } else if (parsed.data.saved) {
    await prisma.favorite.upsert({
      where: { userId_experienceId: { userId, experienceId: parsed.data.experienceId } },
      create: { userId, experienceId: parsed.data.experienceId },
      update: {},
    })
  } else {
    await prisma.favorite.deleteMany({ where: { userId, experienceId: parsed.data.experienceId } })
  }

  return NextResponse.json({ ids: await listIds(userId) })
}
