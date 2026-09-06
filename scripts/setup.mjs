#!/usr/bin/env node
/**
 * Prepara el entorno de desarrollo.
 *
 * Existe porque .env y la base SQLite estan (correctamente) en .gitignore:
 * sin este paso, quien clone el repositorio se encuentra la aplicacion sin
 * base de datos, y tanto el registro como las opiniones fallan con un error
 * generico. Este script convierte eso en un solo comando.
 *
 *   1. Crea .env.local desde .env.example si no existe.
 *   2. Genera un AUTH_SECRET real si esta vacio.
 *   3. Aplica las migraciones.
 *   4. Carga las opiniones de arranque (idempotente).
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

const ENV_FILE = '.env'
const EXAMPLE = '.env.example'

function log(step, message) {
  console.log(`  ${step}  ${message}`)
}

console.log('\nPreparando Experience El Salvador\n')

// 1 y 2 — archivo de entorno
if (!existsSync(ENV_FILE)) {
  if (!existsSync(EXAMPLE)) {
    console.error('  No existe .env.example. No se puede continuar.')
    process.exit(1)
  }
  copyFileSync(EXAMPLE, ENV_FILE)
  log('1.', `${ENV_FILE} creado desde ${EXAMPLE}`)
} else {
  log('1.', `${ENV_FILE} ya existe, se conserva`)
}

let env = readFileSync(ENV_FILE, 'utf8')
let changed = false

if (/^AUTH_SECRET=\s*$/m.test(env)) {
  env = env.replace(/^AUTH_SECRET=\s*$/m, `AUTH_SECRET=${randomBytes(32).toString('base64')}`)
  changed = true
  log('2.', 'AUTH_SECRET generado')
} else {
  log('2.', 'AUTH_SECRET ya definido')
}

if (!/^DATABASE_URL=/m.test(env)) {
  env += '\nDATABASE_URL="file:./dev.db"\n'
  changed = true
  log('  ', 'DATABASE_URL anadido')
}

if (changed) writeFileSync(ENV_FILE, env)

// 3 — migraciones
log('3.', 'Aplicando migraciones...')
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
} catch {
  console.error('\n  Fallaron las migraciones. Revisa DATABASE_URL en .env\n')
  process.exit(1)
}

// 4 — opiniones de arranque
log('4.', 'Cargando opiniones de arranque...')
try {
  execSync('node --experimental-strip-types prisma/seed.ts', { stdio: 'inherit' })
} catch {
  console.error('\n  Fallo el seed.\n')
  process.exit(1)
}

console.log('\nListo. Arranca con:  pnpm dev\n')
