import Link from 'next/link'
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  History,
  KanbanSquare,
  LayoutDashboard,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import { SignOutButton } from '@/components/account/sign-out-button'
import type { AdminUser } from '@/lib/admin/session'

/**
 * Marco del panel: barra lateral blanca + zona de trabajo, en el estilo
 * monocromo de los paneles de gestión (tinta casi negra, blanco y un verde
 * salvia muy pálido para la banda de resumen). Se aparta a propósito de la
 * paleta del sitio público: quien está aquí trabaja, no compra.
 *
 * El panel es UNA página, así que el menú lateral son anclas a sus
 * secciones (con /admin delante, para que funcionen también desde el
 * detalle de una reserva). Los «Atajos» son los mismos filtros rápidos de
 * fechas que había en el formulario.
 *
 * En móvil la barra lateral pasa a ser una cabecera con el menú en una fila
 * deslizable.
 */

const NAV = [
  { href: '/admin#resumen', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin#tablero', label: 'Tablero', icon: KanbanSquare },
  { href: '/admin#reservas', label: 'Reservas', icon: Ticket },
  { href: '/admin#proximas', label: 'Próximas salidas', icon: CalendarClock },
  { href: '/admin#historico', label: 'Ya realizadas', icon: History },
  { href: '/admin#comparativa', label: 'Comparativa', icon: BarChart3 },
] as const

function shortcuts(hoy: string) {
  return [
    { href: `/admin?mes=${hoy.slice(0, 7)}`, label: 'Este mes' },
    { href: `/admin?anio=${hoy.slice(0, 4)}`, label: `Año ${hoy.slice(0, 4)}` },
    { href: `/admin?from=${hoy}`, label: 'De hoy en adelante' },
    { href: `/admin?to=${hoy}`, label: 'Histórico' },
  ]
}

/** Fecha de hoy en El Salvador, AAAA-MM-DD. */
function hoySv(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' })
}

export function AdminShell({ admin, children }: { admin: AdminUser; children: React.ReactNode }) {
  const inicial = (admin.email[0] ?? 'A').toUpperCase()
  const navLink =
    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#17181a]/75 transition hover:bg-[#f2f2ee] hover:text-[#17181a]'

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-[#17181a] lg:flex">
      {/* Barra lateral (escritorio) ------------------------------------ */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#e8e8e3] bg-white px-5 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-3" aria-label="Panel de administración">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17181a] text-white">
            <ShieldCheck size={17} strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">Experiences SV</span>
            <span className="block text-[11px] text-[#17181a]/50">Administración</span>
          </span>
        </Link>

        <nav aria-label="Secciones del panel" className="mt-8 grid gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={navLink}>
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <p className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#17181a]/40">Atajos</p>
        <nav aria-label="Filtros rápidos" className="mt-2 grid gap-0.5">
          {shortcuts(hoySv()).map(({ href, label }) => (
            <Link key={href} href={href} className={navLink}>
              <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <Link href="/" className={`${navLink} mt-6`} target="_blank" rel="noopener">
          <ExternalLink size={17} strokeWidth={1.8} aria-hidden="true" />
          Ver el sitio
        </Link>

        <div className="mt-auto flex items-center gap-3 border-t border-[#ececE7] px-1 pt-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eeefe6] text-sm font-bold">
            {inicial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{admin.email}</span>
            <span className="block text-[11px] text-[#17181a]/50">Administrador</span>
          </span>
          <SignOutButton
            redirectTo="/admin/login"
            compact
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#17181a]/70 transition hover:bg-[#f2f2ee] hover:text-[#17181a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17181a]"
          />
        </div>
      </aside>

      {/* Cabecera (móvil y tablet) ------------------------------------- */}
      <header className="sticky top-0 z-20 border-b border-[#e8e8e3] bg-white lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2" aria-label="Panel de administración">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17181a] text-white">
              <ShieldCheck size={16} strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">Experiences SV</span>
          </Link>
          <SignOutButton
            redirectTo="/admin/login"
            compact
            className="grid h-9 w-9 place-items-center rounded-full border border-[#e8e8e3] text-[#17181a]/70"
          />
        </div>
        <nav aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none]">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e8e8e3] px-3 py-1.5 text-xs font-medium text-[#17181a]/75"
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
