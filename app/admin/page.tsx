import {
  AlertTriangle,
  CalendarClock,
  CircleSlash,
  DollarSign,
  History,
  MountainSnow,
  Ticket,
  TicketCheck,
  Users,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin/session'
import { parseFilters, type AdminSearchParams } from '@/lib/admin/filters'
import { getDashboard } from '@/lib/admin/metrics'
import { completeElapsedBookings } from '@/lib/admin/lifecycle'
import { formatCents } from '@/lib/pricing'
import { AdminShell } from '@/components/admin/admin-shell'
import { AdminFilters } from '@/components/admin/admin-filters'
import { ExportButtons } from '@/components/admin/export-buttons'
import { KpiCard } from '@/components/admin/kpi-card'
import { BarComparison } from '@/components/admin/bar-comparison'
import { SalidasTable } from '@/components/admin/salidas-table'
import { ReservasTable } from '@/components/admin/reservas-table'

/**
 * Dashboard de administración.
 *
 * Server Component: consulta con los filtros de la URL ya aplicados, así
 * que KPIs, gráficos y tablas salen todos de la MISMA lectura y no pueden
 * contradecirse. Las descargas de PDF y Excel usan esos mismos
 * parámetros, así que el archivo coincide con la pantalla.
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
  const reservasPorExperiencia = data.comparativa.map((item) => ({
    id: item.experienceId,
    label: item.titulo,
    value: item.reservas,
    display: String(item.reservas),
  }))

  return (
    <AdminShell admin={admin}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#173f45] md:text-3xl">Resumen general</h1>
          <p className="mt-1.5 text-sm text-[#6a8588]">
            Todo lo que aparece aquí son reservas reales de la base de datos. Los ingresos cuentan solo las que
            tienen el cobro aprobado.
          </p>
        </div>
        <ExportButtons filters={filters} total={data.reservas.length} />
      </div>

      <div className="mt-6">
        <AdminFilters filters={filters} catalogo={data.catalogo} destinos={data.destinos} hoy={data.hoy} />
      </div>

      {/* Avisos honestos sobre lo que se está contando --------------- */}
      {kpis.ingresosPruebaCents > 0 && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#e2c483] bg-[#fdf2dc] px-4 py-3 text-sm font-medium text-[#8a5d0c]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {formatCents(kpis.ingresosPruebaCents)} de los ingresos vienen de pagos de prueba (pasarela simulada o
            sandbox) y no son dinero real. Cobros reales: <strong>{formatCents(kpis.ingresosRealesCents)}</strong>.
            Marca «Solo cobros reales» para dejarlos fuera.
          </span>
        </p>
      )}
      {filters.onlyReal && data.ocultasPorFiltro > 0 && (
        <p className="mt-5 rounded-xl bg-[#eef2f0] px-4 py-3 text-sm text-[#4d6b6f]">
          Hay {data.ocultasPorFiltro}{' '}
          {data.ocultasPorFiltro === 1 ? 'reserva de prueba oculta' : 'reservas de prueba ocultas'} por el filtro
          «Solo cobros reales».
        </p>
      )}

      {data.vacio && (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-[#6a8588] shadow-[0_8px_30px_rgba(26,65,69,.06)]">
          No hay reservas registradas que cumplan estos filtros.
        </p>
      )}

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
            hint={
              kpis.ingresosPruebaCents > 0
                ? `Reales: ${formatCents(kpis.ingresosRealesCents)} · de prueba: ${formatCents(kpis.ingresosPruebaCents)}.`
                : 'Reservas pagadas, confirmadas o completadas.'
            }
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
            label="Reservas completadas"
            value={String(kpis.reservasCompletadas)}
            hint="Pagadas y con la fecha de la experiencia ya pasada."
            icon={History}
          />
          <KpiCard
            label="Reservas pendientes"
            value={String(kpis.reservasPendientes)}
            hint="Con el pago sin completar."
            icon={CalendarClock}
            accent="ambar"
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
        <p className="mt-2 text-xs text-[#6a8588]">
          Hay {kpis.salidasProximas} {kpis.salidasProximas === 1 ? 'salida próxima' : 'salidas próximas'} (de hoy en
          adelante).
        </p>
      </section>

      {/* B. Reservas ------------------------------------------------- */}
      <div className="mt-9">
        <ReservasTable
          rows={data.reservas}
          title="Reservas"
          emptyLabel="Todavía no hay reservas con estos filtros."
        />
      </div>

      {/* C. Próximas experiencias ------------------------------------ */}
      <div className="mt-9">
        <SalidasTable
          rows={data.proximas}
          title="Próximas experiencias"
          caption="Salidas de hoy en adelante, ordenadas por fecha."
          emptyLabel="No hay experiencias próximas con reservas."
        />
      </div>

      {/* D. Histórico ------------------------------------------------ */}
      <div className="mt-9">
        <SalidasTable
          rows={data.historicas}
          title="Experiencias ya realizadas"
          caption="Salidas cuya fecha ya pasó, de la más reciente a la más antigua."
          emptyLabel="Todavía no hay experiencias pasadas con estos filtros."
        />
      </div>

      {/* E. Comparativa ---------------------------------------------- */}
      <section aria-labelledby="comparativa" className="mt-9">
        <h2 id="comparativa" className="mb-3 text-sm font-bold uppercase tracking-[.12em] text-[#759096]">
          Comparativa entre experiencias
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <BarComparison title="Personas por experiencia" description="Viajeros con cobro aprobado." data={personas} />
          <BarComparison title="Ingresos por experiencia" description="Suma de las reservas cobradas." data={ingresos} />
          <BarComparison
            title="Reservas por experiencia"
            description="Todas las reservas, en cualquier estado."
            data={reservasPorExperiencia}
          />
        </div>

        {data.comparativa.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.06)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
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

      <p className="mt-8 text-xs leading-relaxed text-[#6a8588]">
        Una «salida» es una experiencia en una fecha concreta; varias reservas de distintos clientes pueden caer en
        la misma salida. El catálogo no guarda la hora de inicio, por eso las tablas muestran la duración en su
        lugar. El estado de una salida se deduce de sus reservas y de la fecha: cancelada si no queda ninguna
        reserva viva, finalizada si ya pasó y hubo cobro, en curso si es hoy, confirmada si hay cobro y pendiente si
        aún no lo hay.
      </p>
    </AdminShell>
  )
}
