#!/usr/bin/env node
/**
 * Comprueba que Wompi está listo para cobrar.
 *
 *   pnpm wompi:check
 *
 * Lee las mismas variables que la app (.env en desarrollo; en producción,
 * ejecutarlo con las variables del panel del proveedor) y:
 *
 *   1. revisa que estén todas las necesarias para el modo elegido;
 *   2. obtiene un token con las credenciales (POST id.wompi.sv/connect/token);
 *   3. consulta el aplicativo (GET api.wompi.sv/Aplicativo) y compara si
 *      Wompi lo tiene en producción con lo que dice WOMPI_ENVIRONMENT;
 *   4. muestra la URL de webhook que hay que registrar en el panel.
 *
 * NO crea enlaces ni cobros, y nunca imprime claves ni secretos.
 * Sale con código 1 si algo impide cobrar.
 */

const env = (name) => process.env[name]?.trim() || ''

const mode = env('WOMPI_ENVIRONMENT').toLowerCase() || 'mock'
const apiBase = env('WOMPI_API_URL') || 'https://api.wompi.sv'
const authUrl = env('WOMPI_AUTH_URL') || 'https://id.wompi.sv/connect/token'
const site = (env('SITE_URL') || env('URL') || 'http://localhost:3000').replace(/\/+$/, '')

const problems = []
const warnings = []
const ok = (text) => console.log(`  ✔ ${text}`)
const fail = (text) => {
  problems.push(text)
  console.log(`  ✘ ${text}`)
}
const warn = (text) => {
  warnings.push(text)
  console.log(`  ! ${text}`)
}

console.log(`\nWompi · modo ${mode}\n`)

if (mode === 'mock') {
  warn('WOMPI_ENVIRONMENT=mock: los pagos son simulados. Para cobrar, usa sandbox (pruebas) o production.')
  finish()
}
if (mode !== 'sandbox' && mode !== 'production') {
  fail(`WOMPI_ENVIRONMENT="${mode}" no es válido (mock | sandbox | production).`)
  finish()
}

// 1. Variables
const clientId = env('WOMPI_PUBLIC_KEY')
const clientSecret = env('WOMPI_PRIVATE_KEY')
clientId ? ok('WOMPI_PUBLIC_KEY (App ID) definido') : fail('Falta WOMPI_PUBLIC_KEY (App ID del aplicativo).')
clientSecret ? ok('WOMPI_PRIVATE_KEY (API Secret) definido') : fail('Falta WOMPI_PRIVATE_KEY (API Secret del aplicativo).')
env('WOMPI_WEBHOOK_SECRET')
  ? ok('WOMPI_WEBHOOK_SECRET definido')
  : ok('WOMPI_WEBHOOK_SECRET vacío: el webhook se verifica con el API Secret (lo normal)')

if (!site.startsWith('https://')) {
  ;(mode === 'production' ? fail : warn)(
    `La URL del sitio es ${site}. Wompi necesita una URL pública con https para el retorno y el webhook (define SITE_URL).`,
  )
} else {
  ok(`URL del sitio: ${site}`)
}
// 2 y 3. Token y aplicativo
{
  if (clientId && clientSecret) {
    try {
      const tokenResponse = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          audience: 'wompi_api',
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        signal: AbortSignal.timeout(15_000),
      })
      if (!tokenResponse.ok) {
        fail(`Wompi rechazó las credenciales (HTTP ${tokenResponse.status}). Revisa App ID y API Secret.`)
      } else {
        const { access_token: token } = await tokenResponse.json()
        ok('Autenticación correcta')

        const appResponse = await fetch(`${apiBase}/Aplicativo`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(15_000),
        })
        if (!appResponse.ok) {
          fail(`No se pudo consultar el aplicativo (HTTP ${appResponse.status}).`)
        } else {
          const app = await appResponse.json()
          ok(`Aplicativo: ${app.nombre ?? '(sin nombre)'}`)
          if (mode === 'production' && app.estaProductivo !== true) {
            fail('WOMPI_ENVIRONMENT=production pero Wompi tiene el aplicativo en PRUEBAS: los cobros no serían reales y la app los rechazaría. Pide a Wompi que lo pase a producción.')
          } else if (mode === 'sandbox' && app.estaProductivo === true) {
            warn('El aplicativo está en PRODUCCIÓN en Wompi pero WOMPI_ENVIRONMENT=sandbox: los cobros serían reales y la app los marcaría como de prueba. Cambia a production o usa un aplicativo de pruebas.')
          } else {
            ok(app.estaProductivo ? 'Aplicativo en producción: los cobros son reales' : 'Aplicativo en pruebas: los cobros son simulados por Wompi')
          }
        }
      }
    } catch (error) {
      fail(`No hubo respuesta de Wompi: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

// 4. Lo que hay que configurar en el panel de Wompi
console.log('\nEn el panel de Wompi (Aplicativo → Configuración):')
console.log(`  · URL de webhook:  ${site}/api/payments/wompi/webhook`)
console.log('  (la app también la envía en cada enlace de pago, así que basta con que sea pública)')

finish()

function finish() {
  const notes = warnings.length ? ` (${warnings.length} aviso(s))` : ''
  const summary = problems.length
    ? `✘ ${problems.length} problema(s): todavía no se puede cobrar.`
    : mode === 'mock'
      ? '• Modo simulado: la app funciona, pero no se cobra dinero.'
      : mode === 'sandbox'
        ? `✔ Listo para pagos de PRUEBA en Wompi${notes}.`
        : `✔ Listo para cobrar de verdad${notes}.`
  console.log(`\n${summary}\n`)
  process.exit(problems.length ? 1 : 0)
}
