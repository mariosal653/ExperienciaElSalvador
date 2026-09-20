import {
  AlertTriangle,
  CalendarClock,
  CircleSlash,
  DollarSign,
  MountainSnow,
  Ticket,
  TicketCheck,
  Users,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin/session'
import { parseFilters, type AdminSearchParams } from '@/lib/admin/filters'
import { getDashboard } from '@/lib/admin/metrics'
import { formatCents } from '@/lib/pricing'
import { AdminShell } from '@/components/admin/admin-shell'
import { AdminFilters } from '@/components/admin/admin-filters'
import { KpiCard } from '@/components/admin/kpi-card'
import { BarComparison } from '@/components/admin/bar-comparison'
import { SalidasTable } from '@/components/admin/salidas-table'

/**
 * Dashboard de administración.
 *
 * Server Component: consulta con los filtros de la URL ya aplicados, así
 * que KPIs, gráficos y tablas salen todos de la MISMA lectura y no pueden
 * contradecirse entre sí.
 *
 * `force-dynamic` porque son datos de negocio en vivo: una versión
 * cacheada mostraría ingresos de ayer.
 */

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Resumen' }

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>
}) {
  const admin = await requireAdmin('/admin')

  const params = await searchParams
  const filters = parseFilters(params)
  const data = await getDashboard(filters)
  const { kpis } = data

  const personas = data.comparativa.map((item) => ({
    id: item.experienceId,
    label: item.titulo,
    value: item.personas,
    display: String(item.personas),
  }))
  const ingresos = data.comparativa.map((item) => ({
    id: item.experienceId,
    label: item.titulo,
    value: item.ingresoCents,
    display: formatCents(item.ingresoCents),
  }))
  const reservas = data.comparativa.map((item) => ({
    id: item.experienceId,
    label: item.titulo,
    value: item.reservas,
    display: String(item.reservas),
  }))

  return (
    <AdminShell admin={admin}>
      <h1 className="text-2xl font-semibold tracking-tight text-[#173f45] md:text-3xl">Resumen general</h1>
      <p className="mt-1.5 text-sm text-[#6a8588]">
        Datos reales de las reservas registradas. Los ingresos cuentan solo las reservas con el cobro aprobado.
      </p>

      <div className="mt-6">
        <AdminFilters filters={filters} catalogo={data.catalogo} destinos={data.destinos} hoy={data.hoy} />
      </div>

      {/* Avisos honestos sobre lo que se está contando --------------- */}
      {filters.includeTest && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#e2c483] bg-[#fdf2dc] px-4 py-3 text-sm font-medium text-[#8a5d0c]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Estás incluyendo reservas de prueba (pagos simulados o de sandbox). Esos importes no son ingresos reales.
        </p>
      )}
      {!filters.includeTest && kpis.reservasDePruebaExcluidas > 0 && (
        <p className="mt-5 rounded-xl bg-[#eef2f0] px-4 py-3 text-sm text-[#4d6b6f]">
          Se han dejado fuera {kpis.reservasDePruebaExcluidas}{' '}
          {kpis.reservasDePruebaExcluidas === 1 ? 'reserva de prueba' : 'reservas de prueba'} (pago simulado o
          sandbox). Marca «Incluir pruebas» si quieres verlas.
        </p>
      )}

      {data.vacio ? (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-[#6a8588] shadow-[0_8px_30px_rgba(26,65,69,.06)]">
          No hay reservas registradas que cumplan estos filtros.
        </p>
      ) : null}

      {/* A. Resumen general ------------------------------------------ */}
      <section aria-labelledby="kpis" className="mt-6">
        <h2 id="kpis" className="sr-only">Indicadores</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Experiencias realizadas"
            value={String(kpis.salidasRealizadas)}
            hint="Salidas ya pasadas con al menos una reserva cobrada."
            icon={MountainSnow}
          />
          <KpiCard
            label="Personas atendidas"
            value={String(kpis.personasAtendidas)}
            hint="Viajeros de salidas que ya ocurrieron."
            icon={Users}
          />
          <KpiCard
            label="Ingresos"
            value={formatCents(kpis.ingresosCents)}
            hint="Reservas pagadas, confirmadas o completadas."
            icon={DollarSign}
            accent="terracota"
          />
          <KpiCard
            label="Personas reservadas"
            value={String(kpis.personasReservadas)}
            hint="Total de viajeros con cobro aprobado, incluidas las salidas futuras."
            icon={TicketCheck}
          />
          <KpiCard label="Reservas totales" value={String(kpis.reservasTotales)} hint="En cualquier estado." icon={Ticket} />
          <KpiCard
            label="Reservas pendientes"
            value={String(kpis.reservasPendientes)}
            hint="Con el pago sin completar."
            icon={CalendarClock}
            accent="ambar"
          />
          <KpiCard
            label="Experiencias próximas"
            value={String(kpis.salidasProximas)}
            hint="Salidas de hoy en adelante."
            icon={CalendarClock}
          />
          <KpiCard
            label="Reservas canceladas"
            value={String(kpis.reservasCanceladas)}
            hint={
              data.tasaCancelacion === null
                ? 'Sin reservas para calcular la tasa.'
                : `Tasa de cancelación: ${(data.tasaCancelacion * 100).toFixed(1)} %.`
            }
            icon={CircleSlash}
            accent="terracota"
          />
        </div>
      </section>

      {/* B. Próximas experiencias ------------------------------------ */}
      <div className="mt-9">
        <SalidasTable
          rows={data.proximas}
          title="Próximas experiencias"
          caption="Salidas de hoy en adelante, ordenadas por fecha."
          emptyLabel="No hay experiencias próximas con reservas."
        />
      </div>

      {/* C. Comparativa ---------------------------------------------- */}
      <section aria-labelledby="comparativa" className="mt-9">
        <h2 id="comparativa" className="mb-3 text-sm font-bold uppercase tracking-[.12em] text-[#759096]">
          Comparativa entre experiencias
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <BarComparison
            title="Personas por experiencia"
            description="Viajeros con cobro aprobado."
            data={personas}
          />
          <BarComparison
            title="Ingresos por experiencia"
            description="Suma de las reservas cobradas."
            data={ingresos}
          />
          <BarComparison
            title="Reservas por experiencia"
            description="Todas las reservas, en cualquier estado."
            data={reservas}
          />
        </div>

        {data.comparativa.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.06)]">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Métricas derivadas por experiencia: ocupación, promedio de personas por salida e ingreso medio por
                reserva.
              </caption>
              <thead>
                <tr className="border-b border-[#edf0ed] text-xs uppercase tracking-[.1em] text-[#759096]">
                  <th scope="col" className="px-4 py-3 font-bold">Experiencia</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Salidas</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Ocupación</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Personas / salida</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Ingreso medio / reserva</th>
                </tr>
              </thead>
              <tbody>
                {data.comparativa.map((item) => (
                  <tr key={item.experienceId} className="border-b border-[#f3f6f4] last:border-0">
                    <th scope="row" className="max-w-[18rem] truncate px-4 py-3 font-semibold text-[#173f45]">
                      {item.titulo}
                    </th>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">{item.salidas}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {item.ocupacion === null ? (
                        <span className="text-[#9ab0ad]" title="No se conoce el cupo de todas sus salidas">—</span>
                      ) : (
                        `${(item.ocupacion * 100).toFixed(0)} %`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {item.promedioPersonasPorSalida === null ? '—' : item.promedioPersonasPorSalida.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {item.ingresoMedioPorReservaCents === null
                        ? '—'
                        : formatCents(item.ingresoMedioPorReservaCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* D. Todas las salidas ---------------------------------------- */}
      <div className="mt-9">
        <SalidasTable
          rows={data.salidas}
          title="Todas las experiencias"
          caption="Cada fila es una salida: una experiencia en una fecha concreta."
          emptyLabel="No hay experiencias registradas con estos filtros."
        />
      </div>

      <p className="mt-8 text-xs leading-relaxed text-[#6a8588]">
        Una «salida» es una experiencia en una fecha concreta. El catálogo no guarda la hora de inicio, por eso la
        tabla muestra la duración en su lugar. El estado se deduce de las reservas y de la fecha: cancelada si no
        queda ninguna reserva viva, finalizada si ya pasó y hubo cobro, en curso si es hoy, confirmada si hay cobro
        y pendiente si aún no lo hay.
      </p>
    </AdminShell>
  )
}
