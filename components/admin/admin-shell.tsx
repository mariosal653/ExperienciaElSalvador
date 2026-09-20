import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { SignOutButton } from '@/components/account/sign-out-button'
import type { AdminUser } from '@/lib/admin/session'

/**
 * Marco visual del panel: misma paleta y mismos gestos que el área de
 * cliente (components/account/account-shell.tsx), con el escudo en vez de
 * la brújula para que se distinga de un vistazo dónde está uno.
 *
 * El botón de salir es el mismo componente del sitio, apuntando al login
 * del panel.
 */
export function AdminShell({ admin, children }: { admin: AdminUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <header className="border-b border-[#0e3035] bg-[#173f45] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5" aria-label="Panel de administración">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4b942] text-[#173f45]">
              <ShieldCheck size={18} strokeWidth={2.5} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight">
                Experiences <span className="text-[#f4b942]">El Salvador</span>
              </span>
              <span className="block text-xs text-white/70">Panel de administración</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[16rem] truncate text-xs text-white/70 sm:block">{admin.email}</span>
            <SignOutButton redirectTo="/admin/login" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-5 lg:px-8 lg:py-10">{children}</div>
    </div>
  )
}
