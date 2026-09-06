import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { dismissWelcomeModal } from '@/lib/benefits'

/**
 * Marca el popup de bienvenida como descartado.
 *
 * Descartar el popup NO consume el descuento: solo deja de mostrarse
 * automaticamente. Se guarda en base de datos para que no reaparezca al
 * cambiar de dispositivo.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  await dismissWelcomeModal(session.user.id)
  return NextResponse.json({ ok: true })
}
