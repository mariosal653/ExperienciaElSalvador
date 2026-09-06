import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Primera barrera para las rutas privadas.
 *
 * Solo comprueba que EXISTA una cookie de sesion: el middleware corre en el
 * runtime edge y no puede consultar la base de datos. La autorizacion real
 * la hace cada pagina y cada endpoint con `auth()` en el servidor, que si
 * valida la sesion contra la base. Esto es un atajo para redirigir pronto,
 * no la unica defensa.
 */
const PROTECTED = ['/cuenta', '/reservar']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!PROTECTED.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token')

  if (!hasSession) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cuenta/:path*', '/reservar/:path*'],
}
