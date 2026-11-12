import { requireAdmin } from '@/lib/admin/session'
import { parseFilters, type AdminSearchParams } from '@/lib/admin/filters'
import { getDashboard } from '@/lib/admin/metrics'
import { completeElapsedBookings } from '@/lib/admin/lifecycle'
import { DashboardView } from '@/components/admin/dashboard-view'

/**
 * Dashboard de administración.
 *
 * Server Component: consulta con los filtros de la URL ya aplicados, así
 * que KPIs, gráficos y tablas salen todos de la MISMA lectura y no pueden
 * contradecirse. Las descargas de PDF y Excel usan esos mismos
 * parámetros, así que el archivo coincide con la pantalla. La vista vive
 * en components/admin/dashboard-view.tsx.
 *
 * `force-dynamic` porque son datos de negocio en vivo: una versión
 * cacheada mostraría las reservas de ayer.
 */

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Resumen' }

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>
}) {
  const admin = await requireAdmin('/admin')

  // Cierra las reservas cuya fecha ya pasó antes de contar nada: si no,
  // «completadas» sería siempre cero (nadie mueve el estado a COMPLETED).
  await completeElapsedBookings()

  const params = await searchParams
  const filters = parseFilters(params)
  const data = await getDashboard(filters)
  const q = Array.isArray(params.q) ? params.q[0] : params.q

  return <DashboardView admin={admin} data={data} filters={filters} query={q ?? ''} />
}
