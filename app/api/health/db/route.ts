import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Diagnóstico de la base de datos.
 *
 * Dice exactamente qué falla, en vez de obligar a deducirlo desde un
 * mensaje genérico en un formulario.
 *
 * Solo responde en desarrollo: en producción revelaría detalles internos.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'notAvailable' }, { status: 404 })
  }

  const url = process.env.DATABASE_URL
  const checks: Record<string, unknown> = {
    databaseUrlDefinida: Boolean(url),
    // Nunca el valor completo: podría llevar usuario y contraseña.
    motor: url ? url.split(':')[0] : null,
    authSecretDefinida: Boolean(process.env.AUTH_SECRET),
  }

  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        problema: 'DATABASE_URL no está definida en el proceso del servidor.',
        solucion: 'Ejecuta: pnpm bootstrap  (y reinicia el servidor)',
        checks,
      },
      { status: 503 },
    )
  }

  try {
    // ¿Responde el motor?
    await prisma.$queryRaw`SELECT 1`
    checks.conexion = 'ok'

    // ¿Existen las tablas?
    const [users, reviews, bookings] = await Promise.all([
      prisma.user.count(),
      prisma.review.count(),
      prisma.booking.count(),
    ])

    return NextResponse.json({
      ok: true,
      checks: { ...checks, tablas: 'ok' },
      filas: { usuarios: users, opiniones: reviews, reservas: bookings },
    })
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''

    const problema =
      code === 'P2021' || code === 'P2022'
        ? 'La base existe pero le faltan tablas: migraciones sin aplicar.'
        : code.startsWith('P1')
          ? 'No se pudo conectar con la base de datos.'
          : 'Error al consultar la base de datos.'

    return NextResponse.json(
      {
        ok: false,
        problema,
        codigoPrisma: code || null,
        detalle: error instanceof Error ? error.message.split('\n')[0] : String(error),
        solucion: 'Ejecuta: pnpm bootstrap  (y reinicia el servidor)',
        checks,
      },
      { status: 503 },
    )
  }
}
