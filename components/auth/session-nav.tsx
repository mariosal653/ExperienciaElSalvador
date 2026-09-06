'use client'

import { useSession } from 'next-auth/react'
import { User } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'

/**
 * Bloque de sesion del header. Antes el boton "Iniciar sesion" no hacia
 * nada; ahora lleva al login o al perfil segun el estado real.
 */
export function SessionNav() {
  const { data: session, status } = useSession()
  const { lang } = useLanguage()
  const es = lang === 'ES'

  if (status === 'loading') {
    return <span className="h-9 w-24 animate-pulse rounded-full bg-white/20" aria-hidden="true" />
  }

  if (session?.user) {
    const first = session.user.name?.split(' ')[0] ?? (es ? 'Mi cuenta' : 'Account')
    return (
      <a
        href="/cuenta"
        className="flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#173f45]"
      >
        <User size={15} />
        {first}
      </a>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <a href="/login" className="text-sm font-semibold transition hover:text-[#f4b942]">
        {es ? 'Iniciar sesión' : 'Sign in'}
      </a>
      <a
        href="/register"
        className="rounded-full bg-[#b8481c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#963b18]"
      >
        {es ? 'Crear cuenta' : 'Sign up'}
      </a>
    </div>
  )
}
