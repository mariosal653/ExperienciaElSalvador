'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Compass, Loader2, Eye, EyeOff } from 'lucide-react'
import { GoogleIcon, FacebookIcon } from '@/components/reviews/platform-icons'
import { useLanguage } from '@/components/i18n/language-provider'

type Mode = 'login' | 'register'

const COPY = {
  ES: {
    loginTitle: 'Bienvenido de vuelta',
    loginSub: 'Entra para ver tus experiencias y tus beneficios.',
    registerTitle: 'Crea tu cuenta',
    registerSub: 'Regístrate y llévate un 25 % en tu primera experiencia.',
    name: 'Nombre',
    email: 'Correo',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    or: 'o continúa con',
    toRegister: '¿No tienes cuenta? Crear una',
    toLogin: '¿Ya tienes cuenta? Iniciar sesión',
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
    errors: {
      tooShort: 'Escribe tu nombre completo.',
      invalidEmail: 'Ese correo no parece válido.',
      passwordTooShort: 'Usa al menos 8 caracteres.',
      passwordNeedsLetter: 'Incluye al menos una letra.',
      passwordNeedsNumber: 'Incluye al menos un número.',
      emailTaken: 'Ya existe una cuenta con ese correo.',
      credentials: 'Correo o contraseña incorrectos.',
      serverError: 'Algo falló de nuestro lado. Intenta de nuevo.',
    } as Record<string, string>,
    hint: 'Mínimo 8 caracteres, con letras y números.',
  },
  EN: {
    loginTitle: 'Welcome back',
    loginSub: 'Sign in to see your experiences and benefits.',
    registerTitle: 'Create your account',
    registerSub: 'Sign up and get 25% off your first experience.',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    login: 'Sign in',
    register: 'Create account',
    or: 'or continue with',
    toRegister: "Don't have an account? Create one",
    toLogin: 'Already have an account? Sign in',
    show: 'Show password',
    hide: 'Hide password',
    errors: {
      tooShort: 'Enter your full name.',
      invalidEmail: 'That email does not look valid.',
      passwordTooShort: 'Use at least 8 characters.',
      passwordNeedsLetter: 'Include at least one letter.',
      passwordNeedsNumber: 'Include at least one number.',
      emailTaken: 'An account with that email already exists.',
      credentials: 'Wrong email or password.',
      serverError: 'Something failed on our side. Try again.',
    } as Record<string, string>,
    hint: 'At least 8 characters, with letters and numbers.',
  },
}

export function AuthForm({ mode, socialProviders }: { mode: Mode; socialProviders: string[] }) {
  const { lang } = useLanguage()
  const t = COPY[lang]
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/cuenta'

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFormError(null)
    setFields({})

    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')
    const name = String(data.get('name') ?? '')

    try {
      if (mode === 'register') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const payload = await response.json()

        if (!response.ok) {
          if (payload.fields) setFields(payload.fields)
          else setFormError(t.errors[payload.error] ?? t.errors.serverError)
          setLoading(false)
          return
        }
      }

      // Tras registrarse se inicia sesion automaticamente.
      const result = await signIn('credentials', { email, password, redirect: false })

      if (result?.error) {
        setFormError(t.errors.credentials)
        setLoading(false)
        return
      }

      router.push(next)
      router.refresh()
    } catch {
      setFormError(t.errors.serverError)
      setLoading(false)
    }
  }

  const title = mode === 'login' ? t.loginTitle : t.registerTitle
  const subtitle = mode === 'login' ? t.loginSub : t.registerSub

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-[0_18px_50px_rgba(26,65,69,.14)] md:p-9">
      <div className="mb-7 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4b942] text-[#173f45]">
          <Compass size={20} strokeWidth={2.5} />
        </span>
        <span className="text-lg font-bold tracking-tight text-[#173f45]">
          Experience <span className="text-[#b8481c]">El Salvador</span>
        </span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-[#173f45]">{title}</h1>
      <p className="mt-1.5 text-sm text-[#6a8588]">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {mode === 'register' && (
          <Field
            label={t.name}
            name="name"
            type="text"
            autoComplete="name"
            error={fields.name ? t.errors[fields.name] : undefined}
            disabled={loading}
          />
        )}

        <Field
          label={t.email}
          name="email"
          type="email"
          autoComplete="email"
          error={fields.email ? t.errors[fields.email] : undefined}
          disabled={loading}
        />

        <div>
          <Field
            label={t.password}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            error={fields.password ? t.errors[fields.password] : undefined}
            disabled={loading}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t.hide : t.show}
                className="grid h-8 w-8 place-items-center rounded-full text-[#759096] transition hover:bg-[#eaf1ed] hover:text-[#173f45]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {mode === 'register' && !fields.password && (
            <p className="mt-1.5 text-xs text-[#6a8588]">{t.hint}</p>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-[#fae6e0] px-4 py-3 text-sm font-medium text-[#a3341c]">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#b8481c] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === 'login' ? t.login : t.register}
        </button>
      </form>

      {socialProviders.length > 0 && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#dce7e1]" />
            <span className="text-xs font-medium text-[#759096]">{t.or}</span>
            <span className="h-px flex-1 bg-[#dce7e1]" />
          </div>

          <div className="flex flex-col gap-3">
            {socialProviders.includes('google') && (
              <SocialButton provider="google" label="Google" onClick={() => signIn('google', { redirectTo: next })} disabled={loading}>
                <GoogleIcon className="h-4 w-4" />
              </SocialButton>
            )}
            {socialProviders.includes('facebook') && (
              <SocialButton provider="facebook" label="Facebook" onClick={() => signIn('facebook', { redirectTo: next })} disabled={loading}>
                <FacebookIcon className="h-4 w-4" />
              </SocialButton>
            )}
          </div>
        </>
      )}

      <p className="mt-7 text-center text-sm text-[#6a8588]">
        <a
          href={mode === 'login' ? '/register' : '/login'}
          className="font-bold text-[#b8481c] underline-offset-4 hover:underline"
        >
          {mode === 'login' ? t.toRegister : t.toLogin}
        </a>
      </p>
    </div>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
  error,
  disabled,
  trailing,
}: {
  label: string
  name: string
  type: string
  autoComplete: string
  error?: string
  disabled?: boolean
  trailing?: React.ReactNode
}) {
  const id = `field-${name}`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#759096]">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-4 py-3 transition focus-within:border-[#173f45] ${
          error ? 'border-[#b4442c]' : 'border-[#dce7e1]'
        }`}
      >
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full bg-transparent text-sm font-medium text-[#173f45] outline-none placeholder:text-[#96aaa6] disabled:opacity-60"
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-[#a3341c]">
          {error}
        </p>
      )}
    </div>
  )
}

function SocialButton({
  label,
  onClick,
  disabled,
  children,
}: {
  provider: string
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2.5 rounded-full border border-[#dce7e1] bg-white px-5 py-3 text-sm font-semibold text-[#173f45] transition hover:bg-[#f4f7f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
      {label}
    </button>
  )
}
