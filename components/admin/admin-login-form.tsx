'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'

/**
 * Entrada al panel de administración.
 *
 * Usa el MISMO proveedor de credenciales que el login del sitio
 * (`signIn('credentials')`): no hay un segundo sistema de autenticación ni
 * una contraseña guardada aparte. Lo que distingue a un administrador es
 * el rol de su cuenta, y eso lo comprueba el servidor en `requireAdmin()`.
 *
 * Por eso esta pantalla no puede saber si la cuenta tiene permiso: se
 * inicia sesión y se navega a /admin. Si el rol no es ADMIN, el servidor
 * devuelve aquí con `?error=forbidden`.
 */

const ERRORS: Record<string, string> = {
  credentials: 'Correo o contraseña incorrectos.',
  forbidden: 'Esa cuenta no tiene acceso al panel de administración.',
  network: 'No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.',
}

export function AdminLoginForm() {
  const router = useRouter()
  const params = useSearchParams()

  // Solo rutas internas: evita que ?next=https://otro-sitio convierta el
  // login en un redirector abierto.
  const requested = params.get('next') ?? '/admin'
  const next = requested.startsWith('/admin') ? requested : '/admin'

  const [error, setError] = useState<string | null>(() => {
    const code = params.get('error')
    return code ? (ERRORS[code] ?? ERRORS.credentials) : null
  })
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')

    let result
    try {
      result = await signIn('credentials', { email, password, redirect: false })
    } catch {
      setError(ERRORS.network)
      setLoading(false)
      return
    }

    if (result?.error) {
      setError(ERRORS.credentials)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  const field =
    'mt-1.5 w-full rounded-xl border border-[#dce7e1] bg-white px-3.5 py-3 text-base text-[#173f45] outline-none transition placeholder:text-[#9ab0ad] focus:border-[#173f45] focus:ring-2 focus:ring-[#173f45]/15 sm:text-sm'

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-[0_18px_50px_rgba(26,65,69,.14)] md:p-9">
      <div className="mb-7 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#173f45] text-[#f4b942]">
          <ShieldCheck size={20} strokeWidth={2.5} />
        </span>
        <span className="text-lg font-bold tracking-tight text-[#173f45]">
          Experiences <span className="text-[#b8481c]">El Salvador</span>
        </span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-[#173f45]">Panel de administración</h1>
      <p className="mt-1.5 text-sm text-[#6a8588]">Acceso restringido al equipo.</p>

      <form onSubmit={onSubmit} className="mt-7 grid gap-4" noValidate>
        <div>
          <label htmlFor="admin-email" className="text-sm font-semibold text-[#173f45]">
            Correo
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            maxLength={254}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="text-sm font-semibold text-[#173f45]">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="admin-password"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#6a8588] transition hover:bg-[#f2f6f3]"
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-[#fae6e0] px-4 py-3 text-sm font-medium text-[#a3341c]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#173f45] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#0e3035] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8481c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
