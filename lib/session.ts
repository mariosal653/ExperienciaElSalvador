import { redirect } from 'next/navigation'
import { auth } from './auth'

/**
 * Sesion obligatoria en un Server Component.
 *
 * Esta es la comprobacion que cuenta: valida contra la base de datos.
 * El middleware solo mira si hay cookie, y una cookie caducada o de una
 * sesion revocada la pasa; aqui no.
 */
export async function requireUser(nextPath = '/cuenta') {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }
  return session.user
}

export async function getUser() {
  const session = await auth()
  return session?.user?.id ? session.user : null
}
