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
 *
 * RESPUESTAS
 *   201 { ok: true, user }
 *   400 { ok: false, code: 'validationError', fields }
 *   409 { ok: false, code: 'emailTaken' }
 *   503 { ok: false, code: 'databaseNotConfigured' | 'databaseNotMigrated'
 *                        | 'databaseUnreachable' | 'prismaClientMissing' }
 *   500 { ok: false, code: 'internalError' }
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

const DEV = process.env.NODE_ENV !== 'production'

/**
 * Traza paso a paso del registro.
 *
 * Nunca imprime contraseña, hash, tokens ni la URL de conexión completa:
 * solo el motor (`file`, `postgresql`…), que es lo único que hace falta
 * para diagnosticar.
 */
function trace(step: string, detail?: Record<string, unknown>) {
  if (!DEV) return
  const base = {
    endpoint: 'POST /api/register',
    databaseUrlDefinida: Boolean(process.env.DATABASE_URL),
    motor: process.env.DATABASE_URL?.split(':')[0] ?? null,
  }
  console.log(`[register] ${step}`, { ...base, ...(detail ?? {}) })
}

function fail(code: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, code, ...(extra ?? {}) }, { status })
}

export async function POST(request: Request) {
  trace('inicio')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    trace('cuerpo ilegible')
    return fail('invalidBody', 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fields[key]) fields[key] = issue.message
    }
    trace('validacion fallida', { campos: Object.keys(fields) })
    return fail('validationError', 400, { fields })
  }

  const { name, email, password } = parsed.data
  trace('datos validados', { email })

  // El hash se calcula antes de tocar la base: es la operación más lenta
  // y no tiene sentido mantener abierta una transacción mientras corre.
  const passwordHash = await bcrypt.hash(password, 12)
  trace('contrasena cifrada')

  try {
    // La comprobación de duplicado va DENTRO del try: si la base falla,
    // esta es la primera consulta que revienta.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    trace('busqueda de usuario existente', { encontrado: Boolean(existing) })

    if (existing) {
      return fail('emailTaken', 409, { fields: { email: 'emailTaken' } })
    }

    trace('creando usuario y beneficio')
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true },
      })

      // Mismo commit que la cuenta: o existen los dos, o ninguno.
      await grantWelcomeBenefit(tx, created.id)

      return created
    })

    trace('usuario creado', { userId: user.id })
    return NextResponse.json({ ok: true, user }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Clasifica el fallo.
 *
 * El error completo se registra SIEMPRE. Una versión anterior clasificaba
 * por el texto del mensaje con una expresión regular que capturaba
 * «datasource» —palabra presente en muchísimos errores de Prisma— y
 * mandaba al usuario a ejecutar un comando que no arreglaba nada.
 */
function handleError(error: unknown): NextResponse {
  const name = error instanceof Error ? error.constructor.name : typeof error
  const message = error instanceof Error ? error.message : String(error)
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  console.error('[register] fallo:', {
    clase: name,
    codigoPrisma: code || null,
    mensaje: message.split('\n')[0],
    databaseUrlDefinida: Boolean(process.env.DATABASE_URL),
    motor: process.env.DATABASE_URL?.split(':')[0] ?? null,
  })
  if (DEV && error instanceof Error) console.error(error.stack)

  // Carrera entre dos altas con el mismo correo: el índice único gana.
  if (code === 'P2002') {
    return fail('emailTaken', 409, { fields: { email: 'emailTaken' } })
  }

  // Falta la tabla o la columna: migraciones sin aplicar.
  if (code === 'P2021' || code === 'P2022') {
    return fail('databaseNotMigrated', 503)
  }

  // La base no responde.
  if (code === 'P1001' || code === 'P1002' || code === 'P1017') {
    return fail('databaseUnreachable', 503)
  }

  // Configuración ausente: se decide por el ENTORNO, no por el texto.
  if (!process.env.DATABASE_URL) {
    return fail('databaseNotConfigured', 503)
  }

  // El cliente no está generado.
  if (/did not initialize yet|@prisma\/client.*generate/i.test(message)) {
    return fail('prismaClientMissing', 503)
  }

  // Cualquier otra cosa. El detalle ya quedó en el log del servidor; al
  // navegador solo va el código, nunca el mensaje interno.
  return fail('internalError', 500)
}
