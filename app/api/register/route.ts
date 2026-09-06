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

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json(
      { error: 'validation', fields: { email: 'emailTaken' } },
      { status: 409 },
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
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
    // Carrera entre dos altas con el mismo correo: el índice único gana.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'validation', fields: { email: 'emailTaken' } },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'serverError' }, { status: 500 })
  }
}
