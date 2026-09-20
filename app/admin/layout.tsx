import type { Metadata } from 'next'

/**
 * Marco de /admin.
 *
 * Deliberadamente NO comprueba la sesión: un layout de Next.js también
 * envuelve a /admin/login, que tiene que ser público. La autorización la
 * hace cada página con `requireAdmin()`, que es además donde tiene que
 * estar: en el servidor y contra la base de datos.
 *
 * Lo único que hace aquí es marcar toda la sección como no indexable.
 */
export const metadata: Metadata = {
  title: { default: 'Administración', template: '%s · Administración' },
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
