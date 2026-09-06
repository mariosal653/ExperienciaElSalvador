import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { grantWelcomeBenefit } from '@/lib/benefits'

/**
 * Alta de usuario con correo y contraseña.
 *
 * La contraseña se guarda como hash bcrypt (coste 12). Nunca en claro,
 * nunca en los registros, nunca en la respuesta.
 *
 * El usuario y su beneficio de bienvenida se crean en la MISMA
 * transacción: no puede existir una cuenta sin beneficio ni al revés.
 */

const schema = z.object({
  name: z.string().trim().min(2, 'tooShort').max(120),
  email: z.string().trim().toLowerCase().email('invalidEmail'),
  password: z
    .string()
    .min(8, 'passwordTooShort')
    .max(200)
    .regex(/[a-zA-Z]/, 'passwordNeedsLetter')
    .regex(/[0-9]/, 'passwordNeedsNumber'),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalidBody' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return NextResponse.json({ error: 'validation', fields: fieldErrors }, { status: 422 })
  }

  const { name, email, password } = parsed.data

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    // La comprobación de duplicado va DENTRO del try: si la base no está
    // disponible o le faltan las tablas, esta consulta es la primera que
    // falla, y antes quedaba fuera del manejo de errores. Ese era el
    // origen del «Algo falló de nuestro lado».
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return NextResponse.json(
        { error: 'validation', fields: { email: 'emailTaken' } },
        { status: 409 },
      )
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true },
      })

      // Mismo commit que la cuenta: o existen los dos, o ninguno.
      await grantWelcomeBenefit(tx, created.id)

      return created
    })

    return NextResponse.json({ ok: true, user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(...describeError(error))
  }
}

/**
 * Traduce el fallo a un código útil.
 *
 * Antes cualquier problema devolvía `serverError`, que en pantalla se
 * convertía siempre en «Algo falló de nuestro lado» — el mensaje que no
 * dice nada ni al usuario ni a quien tiene que arreglarlo.
 *
 * Los códigos de Prisma en https://www.prisma.io/docs/orm/reference/error-reference
 */
function describeError(error: unknown): [Record<string, unknown>, { status: number }] {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  // Carrera entre dos altas con el mismo correo: el índice único gana.
  if (code === 'P2002') {
    return [{ error: 'validation', fields: { email: 'emailTaken' } }, { status: 409 }]
  }

  // La base no responde o no existe.
  if (code === 'P1001' || code === 'P1002' || code === 'P1017') {
    return [{ error: 'databaseUnreachable' }, { status: 503 }]
  }

  // Falta la tabla: migraciones sin aplicar.
  if (code === 'P2021' || code === 'P2022') {
    return [{ error: 'databaseNotMigrated' }, { status: 503 }]
  }

  // Sin DATABASE_URL, Prisma falla al inicializarse.
  const message = error instanceof Error ? error.message : ''
  if (/DATABASE_URL|datasource|Environment variable not found/i.test(message)) {
    return [{ error: 'databaseNotConfigured' }, { status: 503 }]
  }

  // Cualquier otra cosa: se registra en el servidor con el detalle real,
  // y al cliente solo va el código. El detalle no se filtra al navegador.
  console.error('[register] error inesperado:', error)
  return [{ error: 'serverError' }, { status: 500 }]
}
