import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Primera barrera para las rutas privadas.
 *
 * (Antes middleware.ts: Next.js 16 renombró el convenio a proxy.ts y marcó
 * el anterior como obsoleto. Misma función, mismo comportamiento.)
 *
 * Solo comprueba que EXISTA una cookie de sesion: el proxy corre en el
 * runtime edge y no puede consultar la base de datos. La autorizacion real
 * la hace cada pagina y cada endpoint en el servidor —`auth()` para el
 * area de cliente, `requireAdmin()` para /admin—, que si validan contra la
 * base. Esto es un atajo para redirigir pronto, no la unica defensa.
 *
 * Reservar NO esta aqui: la compra no exige cuenta (guest checkout).
 */
const PROTECTED = ['/cuenta', '/admin']

/** /admin manda a su propio login; el resto, al del sitio. */
function loginPathFor(pathname: string): string {
  return pathname.startsWith('/admin') ? '/admin/login' : '/login'
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // El login del panel tiene que ser accesible sin sesion, o no habria
  // forma de entrar.
  if (pathname === '/admin/login') return NextResponse.next()

  if (!PROTECTED.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token')

  if (!hasSession) {
    const url = new URL(loginPathFor(pathname), request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cuenta/:path*', '/admin/:path*'],
}
