import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/admin/session'
import { AdminLoginForm } from '@/components/admin/admin-login-form'

/**
 * Login del panel. Es la única ruta bajo /admin que no exige sesión: si la
 * exigiera, no habría forma de entrar.
 *
 * `noindex`: el panel no debe aparecer en buscadores.
 */

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  // Quien ya es administrador no necesita ver el formulario. Una sesión de
  // usuario normal SÍ lo ve: tiene que entrar con otra cuenta.
  if (await getAdmin()) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eaf1ed] px-5 py-14">
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </main>
  )
}
