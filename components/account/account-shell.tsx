import Link from 'next/link'
import { Compass, User, CalendarRange, Heart } from 'lucide-react'
import { SignOutButton } from './sign-out-button'

/** Marco comun de las paginas de cuenta. Reutiliza el lenguaje visual del sitio. */
export function AccountShell({
  user,
  active,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  active: 'perfil' | 'experiencias' | 'guardadas'
  children: React.ReactNode
}) {
  const nav = [
    { key: 'perfil' as const, href: '/cuenta', label: 'Mi perfil', icon: User },
    { key: 'experiencias' as const, href: '/cuenta/experiencias', label: 'Mis experiencias', icon: CalendarRange },
    { key: 'guardadas' as const, href: '/cuenta/guardadas', label: 'Guardadas', icon: Heart },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-brand text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Experiences El Salvador · Inicio">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-brand">
              <Compass size={18} strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold tracking-tight">
              Experiences <span className="text-gold">El Salvador</span>
            </span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">
        <nav aria-label="Cuenta" className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {nav.map(({ key, href, label, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                active === key
                  ? 'bg-brand text-white'
                  : 'border border-line bg-white text-brand hover:bg-surface-mint'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  )
}
