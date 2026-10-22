#!/usr/bin/env node
/**
 * Prepara el entorno de desarrollo.
 *
 * Existe porque .env esta (correctamente) en .gitignore:
 * sin este paso, quien clone el repositorio se encuentra la aplicacion sin
 * base de datos, y tanto el registro como las opiniones fallan.
 *
 * Se ejecuta solo en cada `pnpm dev` gracias al hook `predev`, asi que ese
 * escenario ya no puede darse. Es IDEMPOTENTE y, con todo en su sitio,
 * termina rapido sin imprimir nada (--quiet).
 *
 *   1. Crea .env desde .env.example si no existe.
 *   2. Genera un AUTH_SECRET real si falta.
 *   3. Comprueba que DATABASE_URL apunte a Postgres (no la inventa).
 *   4. Aplica migraciones (migrate deploy no hace nada si ya estan).
 *   5. Carga las opiniones de arranque.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

const QUIET = process.argv.includes('--quiet')
const ENV_FILE = '.env'
const EXAMPLE = '.env.example'

/** Solo en modo normal: detalle para quien ejecuta el script a mano. */
const log = (message) => {
  if (!QUIET) console.log(message)
}
/** Siempre: cambios reales que el desarrollador debe ver. */
const always = (message) => console.log(message)

let didSomething = false

log('\nPreparando Experiences El Salvador\n')

// --- 1. Archivo de entorno -------------------------------------------
if (!existsSync(ENV_FILE)) {
  if (!existsSync(EXAMPLE)) {
    console.error(`\n  Falta ${EXAMPLE}. No se puede preparar el entorno.\n`)
    process.exit(1)
  }
  copyFileSync(EXAMPLE, ENV_FILE)
  always(`  ${ENV_FILE} creado desde ${EXAMPLE}`)
  didSomething = true
} else {
  log(`  ${ENV_FILE} ya existe`)
}

let env = readFileSync(ENV_FILE, 'utf8')
let envChanged = false

// --- 2. AUTH_SECRET ---------------------------------------------------
if (!/^AUTH_SECRET=.+/m.test(env)) {
  const secret = randomBytes(32).toString('base64')
  env = /^AUTH_SECRET=/m.test(env)
    ? env.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`)
    : `${env}\nAUTH_SECRET=${secret}\n`
  envChanged = true
  always('  AUTH_SECRET generado')
}

if (envChanged) {
  writeFileSync(ENV_FILE, env)
  didSomething = true
}

// --- 3. DATABASE_URL --------------------------------------------------
// La base es Postgres (Neon): ya no hay base local que crear. Hace falta la
// cadena de una rama de DESARROLLO, nunca la de produccion.
// Los comandos de Prisma necesitan las variables en ESTE proceso: el .env
// todavia no esta cargado aqui.
const readVar = (name) => new RegExp(`^${name}=\\s*"?([^"\\r\\n]+)"?`, 'm').exec(env)?.[1]
const dbUrl = readVar('DATABASE_URL') ?? process.env.DATABASE_URL
if (!dbUrl || !/^postgres(ql)?:\/\//.test(dbUrl)) {
  console.error('\n  DATABASE_URL en .env no es una base Postgres.')
  console.error('  Pon la cadena de la rama "development" de Neon (ver .env.example).\n')
  process.exit(1)
}
const childEnv = {
  ...process.env,
  DATABASE_URL: dbUrl,
  DIRECT_URL: readVar('DIRECT_URL') ?? process.env.DIRECT_URL ?? dbUrl,
}

// --- 4. Migraciones ---------------------------------------------------
try {
  const output = execSync('npx prisma migrate deploy', {
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString()

  if (/Applying migration/.test(output)) {
    always('  Migraciones aplicadas')
    didSomething = true
  } else {
    log('  Migraciones ya al dia')
  }
} catch (error) {
  console.error('\n  No se pudieron aplicar las migraciones.')
  console.error('  Revisa DATABASE_URL en .env\n')
  console.error(String(error.stdout ?? error.message).slice(0, 500))
  process.exit(1)
}

// --- 5. Opiniones de arranque ----------------------------------------
try {
  const output = execSync('node --experimental-strip-types prisma/seed.ts', {
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString()

  const real = /Opiniones reales: (\d+)/.exec(output)?.[1]
  log(`  Opiniones de arranque listas${real ? ` (reales en base: ${real})` : ''}`)
} catch (error) {
  // Que falle el seed no impide arrancar: la seccion de opiniones tiene
  // respaldo en memoria.
  always('  Aviso: no se cargaron las opiniones de arranque.')
  if (!QUIET) console.error(String(error.stdout ?? error.message).slice(0, 300))
}

if (didSomething && QUIET) {
  always('  Entorno preparado.\n')
}

log('\nListo. Arranca con:  pnpm dev\n')
