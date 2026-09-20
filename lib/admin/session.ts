import { redirect } from 'next/navigation'
import { auth } from '../auth'
import { prisma } from '../db'

/**
 * Autorización del panel de administración. SOLO SERVIDOR.
 *
 * Reutiliza la sesión de Auth.js que ya usa el resto del sitio: no hay un
 * segundo sistema de login. Lo único que se añade es la comprobación del
 * rol, y esa comprobación se hace SIEMPRE contra la base de datos.
 *
 * Por qué contra la base y no contra el token: la estrategia de sesión es
 * JWT (obligatorio para el proveedor de credenciales, ver lib/auth.ts) y
 * un JWT no se puede revocar. Si el rol viajara dentro del token, retirar
 * el permiso a una cuenta no surtiría efecto hasta que caducara su sesión
 * —hasta 30 días—. Leyéndolo de la base, el cambio es inmediato.
 *
 * El proxy (proxy.ts) solo mira si existe la cookie: es un atajo para
 * redirigir pronto, no la defensa. La defensa es esta función, y toda
 * página y endpoint de /admin la llama.
 */

export type AdminUser = {
  id: string
  name: string | null
  email: string
}

/** El usuario de la sesión actual, con su rol, o null si no hay sesión. */
async function currentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  })
}

/**
 * Exige una sesión con rol ADMIN en un Server Component.
 *
 *   sin sesión        → /admin/login (con la ruta a la que volver)
 *   sesión sin rol    → /admin/login?error=forbidden
 *
 * Se redirige en vez de mostrar un 403 para no dar pistas sobre qué
 * cuentas existen y cuáles tienen permiso.
 */
export async function requireAdmin(nextPath = '/admin'): Promise<AdminUser> {
  const user = await currentUser()

  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`)
  }

  if (user.role !== 'ADMIN') {
    redirect('/admin/login?error=forbidden')
  }

  return { id: user.id, name: user.name, email: user.email }
}

/**
 * Versión para endpoints: no redirige, responde si hay permiso o no. La
 * usa cualquier route handler bajo /api/admin.
 */
export async function isAdminRequest(): Promise<boolean> {
  const user = await currentUser()
  return user?.role === 'ADMIN'
}

/** ¿La sesión actual es de un administrador? Para adaptar la interfaz. */
export async function getAdmin(): Promise<AdminUser | null> {
  const user = await currentUser()
  if (user?.role !== 'ADMIN') return null
  return { id: user.id, name: user.name, email: user.email }
}
