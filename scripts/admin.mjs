#!/usr/bin/env node
/**
 * Provisiona la cuenta de administrador a partir de variables de entorno.
 *
 *   pnpm admin:setup
 *
 * Lee ADMIN_EMAIL y ADMIN_PASSWORD del entorno (.env en desarrollo, el
 * panel del proveedor en producción). NO hay credenciales en el código ni
 * en el repositorio, y la contraseña se guarda como hash bcrypt: la misma
 * columna `passwordHash` que usa el resto de las cuentas.
 *
 * IDEMPOTENTE: ejecutarlo otra vez actualiza el rol y, si ADMIN_PASSWORD
 * cambió, la contraseña. No crea cuentas duplicadas ni toca ninguna otra.
 *
 * Si el correo ya pertenece a un usuario normal, esa misma cuenta pasa a
 * ADMIN en lugar de crear otra: el correo es la llave única del sistema.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const MIN_PASSWORD = 12

function fail(message) {
  console.error(`\n  ERROR  ${message}\n`)
  process.exit(1)
}

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD ?? ''
const name = process.env.ADMIN_NAME?.trim() || 'Administración'

if (!email) {
  fail('Falta ADMIN_EMAIL. Defínela en .env (ver .env.example) y vuelve a ejecutar.')
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  fail(`ADMIN_EMAIL no parece un correo válido: ${email}`)
}
if (password.length < MIN_PASSWORD) {
  fail(
    `ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD} caracteres. ` +
      'Genera una con: openssl rand -base64 24',
  )
}

const prisma = new PrismaClient()

try {
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  })

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', name },
    create: { email, passwordHash, role: 'ADMIN', name, emailVerified: new Date() },
    select: { id: true, email: true },
  })

  const verb = !existing ? 'creada' : existing.role === 'ADMIN' ? 'actualizada' : 'promovida a ADMIN'
  console.log(`\n  Cuenta de administrador ${verb}: ${user.email}`)
  console.log('  Entra en /admin/login con ese correo y la contraseña de ADMIN_PASSWORD.\n')
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
} finally {
  await prisma.$disconnect()
}
