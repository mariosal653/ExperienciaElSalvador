import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payments/config'
import { verifyWebhookSignature, type WompiWebhookPayload } from '@/lib/payments/wompi'
import { reconcileWompiTransaction } from '@/lib/payments/process'

/**
 * POST /api/payments/wompi/webhook
 *
 * Wompi avisa aquí de las transacciones APROBADAS (no manda aviso de las
 * rechazadas). Doble verificación antes de tocar nada:
 *
 *   1. Firma: cabecera `wompi_hash` = HMAC-SHA256(cuerpo crudo, API Secret).
 *      Sin firma válida → 401 y no se lee nada más.
 *   2. Consulta a la API de Wompi (GET /TransaccionCompra/{id}): el estado
 *      y el importe que cuentan son los que dice Wompi en ese momento, no
 *      los del cuerpo del aviso.
 *
 * Idempotente: el mismo aviso recibido dos o diez veces aprueba un pago y
 * emite un juego de entradas. Siempre se responde 200 a los avisos
 * válidos ya procesados, para que Wompi deje de reintentar.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const config = getPaymentConfig()
  if (config.status !== 'ready' || config.mode === 'mock') {
    return NextResponse.json({ ok: false, code: 'wompiNotConfigured' }, { status: 503 })
  }

  // Cuerpo CRUDO: la firma se calcula sobre los bytes exactos recibidos.
  const rawBody = await request.text()
  const signature = request.headers.get('wompi_hash') ?? request.headers.get('wompi-hash')

  if (!verifyWebhookSignature(rawBody, signature, config.webhookSecret)) {
    console.warn('[webhook] firma inválida o ausente')
    return NextResponse.json({ ok: false, code: 'invalidSignature' }, { status: 401 })
  }

  let payload: WompiWebhookPayload
  try {
    payload = JSON.parse(rawBody) as WompiWebhookPayload
  } catch {
    return NextResponse.json({ ok: false, code: 'invalidBody' }, { status: 400 })
  }

  const reference = payload.EnlacePago?.IdentificadorEnlaceComercio
  const transactionId = payload.IdTransaccion
  if (!reference || !transactionId) {
    return NextResponse.json({ ok: false, code: 'missingFields' }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({ where: { reference }, select: { id: true } })
  if (!payment) {
    // Firma válida pero referencia desconocida: pago de otro sistema del
    // mismo comercio. Se confirma recepción para que no se reintente.
    console.warn('[webhook] referencia desconocida', { reference })
    return NextResponse.json({ ok: true, ignored: 'unknownReference' })
  }

  const result = await reconcileWompiTransaction(payment.id, String(transactionId), 'webhook')

  if (result.outcome === 'unavailable') {
    // No se pudo consultar a Wompi: 503 para que reintente más tarde.
    return NextResponse.json({ ok: false, code: 'verificationUnavailable' }, { status: 503 })
  }

  return NextResponse.json({ ok: true, outcome: result.outcome })
}
