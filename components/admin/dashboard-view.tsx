import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleSlash,
  History,
  MountainSnow,
  Search,
  SlidersHorizontal,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import type { AdminUser } from '@/lib/admin/session'
import { hasFilters, toSearchParams, type AdminFilters as Filters } from '@/lib/admin/filters'
import type { AdminDashboard, ReservaRow } from '@/lib/admin/metrics'
import { formatCents } from '@/lib/pricing'
import { AdminShell } from './admin-shell'
import { AdminFilters } from './admin-filters'
import { ExportButtons } from './export-buttons'
import { KpiCard } from './kpi-card'
import { BarComparison } from './bar-comparison'
import { SalidasTable } from './salidas-table'
import { ReservasTable } from './reservas-table'
import { ReservasBoard } from './reservas-board'
import { ActivityChart, type ActivityDay } from './activity-chart'
import { Gauge } from './gauge'

/**
 * Vista del dashboard de administración. Solo pinta: los datos los carga
 * app/admin/page.tsx (Server Component) y llegan ya filtrados. Separarla
 * de la carga permite revisarla con datos de ejemplo sin base de datos.
 *
 * Estructura, de arriba abajo:
 *   barra superior  búsqueda, filtros (desplegables) y exportar
 *   banda resumen   actividad de la semana, % cobrado y las dos cifras clave
 *   indicadores     el resto de KPIs
 *   tablero         reservas por estado, como un kanban
 *   tablas          reservas, próximas salidas, histórico y comparativa
 *
 * La BÚSQUEDA (?q=) acota solo el tablero y la tabla de reservas: es para
 * encontrar a un cliente, no un filtro de negocio, así que no toca KPIs ni
 * descargas.
 */

const COBRADAS = new Set(['PAID', 'CONFIRMED', 'COMPLETED'])

/** Día de creación de la reserva en hora de El Salvador, AAAA-MM-DD. */
function diaSv(value: Date): string {
  return value.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' })
}

/** Los siete días que terminan en `hoy`, con lo reservado cada día. */
function actividadSemana(reservas: ReservaRow[], hoy: string): ActivityDay[] {
  const base = new Date(`${hoy}T12:00:00Z`)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(base)
    day.setUTCDate(base.getUTCDate() - (6 - index))
    const iso = day.toISOString().slice(0, 10)
    const delDia = reservas.filter((row) => diaSv(row.createdAt) === iso)
    const cobradas = delDia.filter((row) => COBRADAS.has(row.status)).length
    return {
      date: iso,
      label: day.toLocaleDateString('es-SV', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
      cobradas,
      sinCobro: delDia.length - cobradas,
    }
  })
}

function coincide(row: ReservaRow, q: string): boolean {
  const needle = q.toLowerCase()
  return [row.code, row.customerName, row.customerEmail, row.customerPhone, row.experienceTitle].some((value) =>
    value?.toLowerCase().includes(needle),
  )
}

export function DashboardView({
  admin,
  data,
  filters,
  query,
}: {
  admin: AdminUser
  data: AdminDashboard
  filters: Filters
  query: string
}) {
  const { kpis } = data
  const q = query.trim().slice(0, 80)
  const reservasVisibles = q ? data.reservas.filter((row) => coincide(row, q)) : data.reservas

  const actividad = actividadSemana(data.reservas, data.hoy)
  const vivas = data.reservas.filter((row) => row.status !== 'CANCELLED')
  const tasaCobro = vivas.length === 0 ? null : vivas.filter((row) => COBRADAS.has(row.status)).length / vivas.length

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

  const filtrosActivos = hasFilters(filters)
  const pad = 'px-4 sm:px-6 lg:px-10'
  const section = 'scroll-mt-28 lg:scroll-mt-6'

  return (
    <AdminShell admin={admin}>
      {/* Barra superior ------------------------------------------------ */}
      <div className={`flex flex-wrap items-center gap-3 border-b border-[#e8e8e3] bg-[#eeefe6] py-4 ${pad}`}>
        <form method="get" role="search" className="relative order-1 min-w-0 flex-1 basis-64">
          {/* Conserva los filtros activos al buscar. */}
          {[...toSearchParams(filters)].map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#17181a]/50" aria-hidden="true" />
          <label htmlFor="admin-q" className="sr-only">Buscar reserva</label>
          <input
            id="admin-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por código, cliente, correo o teléfono…"
            className="w-full rounded-xl border border-transparent bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-[#17181a]/45 focus:border-[#17181a]/30 focus:bg-white"
          />
        </form>

        <div className="order-2 flex items-center gap-2">
          <a
            href="#filtros-panel"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-white/70 ${
              filtrosActivos ? 'bg-white' : ''
            }`}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filtros
            {filtrosActivos && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="(hay filtros activos)" />}
          </a>
          <ExportButtons filters={filters} total={data.reservas.length} />
        </div>
      </div>

      {/* Banda de resumen ---------------------------------------------- */}
      <section id="resumen" aria-labelledby="resumen-title" className={`${section} bg-[#eeefe6] pb-8 pt-6 ${pad}`}>
        <h1 id="resumen-title" className="text-2xl font-medium tracking-tight md:text-3xl">Resumen general</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#17181a]/60">
          Reservas reales de la base de datos. Los ingresos cuentan solo las que tienen el cobro aprobado.
        </p>

        <div className="mt-7 grid items-end gap-8 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.3fr]">
          <ActivityChart days={actividad} title="Reservas nuevas" />
          <Gauge value={tasaCobro} label="Reservas cobradas" />
          <div className="grid grid-cols-2 gap-6 md:col-span-2 xl:col-span-1">
            <Cifra
              value={formatCents(kpis.ingresosCents)}
              label="Ingresos cobrados"
              href="#comparativa"
            />
            <Cifra
              value={String(kpis.personasReservadas)}
              label="Personas con reserva pagada"
              href="#proximas"
            />
          </div>
        </div>
      </section>

      <div className={`pb-12 ${pad}`}>
        {/* Filtros (ancla de «Filtros» en la barra superior) ------------ */}
        <details id="filtros-panel" open={filtrosActivos} className="group mt-6 scroll-mt-28 lg:scroll-mt-6">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#17181a]/70 hover:text-[#17181a] [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span className="group-open:hidden">Mostrar filtros</span>
            <span className="hidden group-open:inline">Ocultar filtros</span>
          </summary>
          <div className="mt-3">
            <AdminFilters filters={filters} catalogo={data.catalogo} destinos={data.destinos} hoy={data.hoy} />
          </div>
        </details>

        {/* Avisos honestos sobre lo que se está contando ------------- */}
        {kpis.ingresosPruebaCents > 0 && (
          <p className="mt-5 flex items-start gap-2 rounded-xl border border-gold-line bg-gold-pale px-4 py-3 text-sm font-medium text-gold-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              {formatCents(kpis.ingresosPruebaCents)} de los ingresos vienen de pagos de prueba (pasarela simulada o
              sandbox) y no son dinero real. Cobros reales: <strong>{formatCents(kpis.ingresosRealesCents)}</strong>.
              Marca «Solo cobros reales» en los filtros para dejarlos fuera.
            </span>
          </p>
        )}
        {filters.onlyReal && data.ocultasPorFiltro > 0 && (
          <p className="mt-5 rounded-xl bg-[#efefea] px-4 py-3 text-sm text-[#17181a]/60">
            Hay {data.ocultasPorFiltro}{' '}
            {data.ocultasPorFiltro === 1 ? 'reserva de prueba oculta' : 'reservas de prueba ocultas'} por el filtro
            «Solo cobros reales».
          </p>
        )}
        {q && (
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#e3e3de] bg-white px-4 py-3 text-sm">
            <span>
              {reservasVisibles.length} {reservasVisibles.length === 1 ? 'reserva coincide' : 'reservas coinciden'} con
              «<strong>{q}</strong>». Los indicadores no cambian con la búsqueda.
            </span>
            <Link
              href={`/admin?${toSearchParams(filters).toString()}`}
              className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
            >
              <X size={14} aria-hidden="true" /> Quitar búsqueda
            </Link>
          </p>
        )}

        {data.vacio && (
          <p className="mt-6 rounded-2xl border border-[#e3e3de] bg-white px-5 py-10 text-center text-sm text-[#17181a]/60">
            No hay reservas registradas que cumplan estos filtros.
          </p>
        )}

        {/* Indicadores ------------------------------------------------- */}
        <section aria-labelledby="kpis" className="mt-6">
          <h2 id="kpis" className="sr-only">Indicadores</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <KpiCard
              label="Experiencias realizadas"
              value={String(kpis.salidasRealizadas)}
              hint="Salidas pasadas con al menos una reserva cobrada."
              icon={MountainSnow}
            />
            <KpiCard
              label="Personas atendidas"
              value={String(kpis.personasAtendidas)}
              hint="Viajeros de salidas que ya ocurrieron."
              icon={Users}
            />
            <KpiCard label="Reservas totales" value={String(kpis.reservasTotales)} hint="En cualquier estado." icon={Ticket} />
            <KpiCard
              label="Completadas"
              value={String(kpis.reservasCompletadas)}
              hint="Pagadas y con la fecha ya pasada."
              icon={History}
            />
            <KpiCard
              label="Pendientes"
              value={String(kpis.reservasPendientes)}
              hint="Con el pago sin completar."
              icon={CalendarClock}
              accent="ambar"
            />
            <KpiCard
              label="Canceladas"
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
          <p className="mt-2 text-xs text-[#17181a]/50">
            {kpis.ingresosPruebaCents > 0 &&
              `Ingresos reales: ${formatCents(kpis.ingresosRealesCents)} · de prueba: ${formatCents(kpis.ingresosPruebaCents)}. `}
            Hay {kpis.salidasProximas} {kpis.salidasProximas === 1 ? 'salida próxima' : 'salidas próximas'} (de hoy en
            adelante).
          </p>
        </section>

        {/* Tablero por estado ------------------------------------------ */}
        <section id="tablero" aria-labelledby="tablero-title" className={`mt-10 ${section}`}>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="tablero-title" className="text-lg font-medium tracking-tight">Reservas por estado</h2>
            <p className="hidden text-xs text-[#17181a]/50 sm:block">Pasa el ratón por una tarjeta para ver el contacto.</p>
          </div>
          <ReservasBoard rows={reservasVisibles} filters={filters} />
        </section>

        {/* Reservas ---------------------------------------------------- */}
        <div id="reservas" className={`mt-10 ${section}`}>
          <ReservasTable
            rows={reservasVisibles}
            title="Reservas"
            emptyLabel={q ? 'Ninguna reserva coincide con la búsqueda.' : 'Todavía no hay reservas con estos filtros.'}
          />
        </div>

        {/* Próximas experiencias -------------------------------------- */}
        <div id="proximas" className={`mt-10 ${section}`}>
          <SalidasTable
            rows={data.proximas}
            title="Próximas experiencias"
            caption="Salidas de hoy en adelante, ordenadas por fecha."
            emptyLabel="No hay experiencias próximas con reservas."
          />
        </div>

        {/* Histórico --------------------------------------------------- */}
        <div id="historico" className={`mt-10 ${section}`}>
          <SalidasTable
            rows={data.historicas}
            title="Experiencias ya realizadas"
            caption="Salidas cuya fecha ya pasó, de la más reciente a la más antigua."
            emptyLabel="Todavía no hay experiencias pasadas con estos filtros."
          />
        </div>

        {/* Comparativa ------------------------------------------------- */}
        <section id="comparativa" aria-labelledby="comparativa-title" className={`mt-10 ${section}`}>
          <h2 id="comparativa-title" className="mb-3 text-lg font-medium tracking-tight">
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
            <div className="mt-3 overflow-x-auto rounded-2xl border border-[#e3e3de] bg-white">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">
                  Métricas derivadas por experiencia: ocupación, promedio de personas por salida e ingreso medio por
                  reserva.
                </caption>
                <thead>
                  <tr className="border-b border-[#ececE7] text-xs text-[#17181a]/50">
                    <th scope="col" className="px-4 py-3 font-medium">Experiencia</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Salidas</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Ocupación</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Personas / salida</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Ingreso medio / reserva</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comparativa.map((item) => (
                    <tr key={item.experienceId} className="border-b border-[#f2f2ee] last:border-0">
                      <th scope="row" className="max-w-[18rem] truncate px-4 py-3 font-medium">
                        {item.titulo}
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums text-[#17181a]/65">{item.salidas}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#17181a]/65">
                        {item.ocupacion === null ? (
                          <span className="text-[#17181a]/35" title="No se conoce el cupo de todas sus salidas">—</span>
                        ) : (
                          `${(item.ocupacion * 100).toFixed(0)} %`
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#17181a]/65">
                        {item.promedioPersonasPorSalida === null ? '—' : item.promedioPersonasPorSalida.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#17181a]/65">
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

        <p className="mt-8 text-xs leading-relaxed text-[#17181a]/50">
          Una «salida» es una experiencia en una fecha concreta; varias reservas de distintos clientes pueden caer en
          la misma salida. El catálogo no guarda la hora de inicio, por eso las tablas muestran la duración en su
          lugar. El estado de una salida se deduce de sus reservas y de la fecha: cancelada si no queda ninguna
          reserva viva, finalizada si ya pasó y hubo cobro, en curso si es hoy, confirmada si hay cobro y pendiente
          si aún no lo hay.
        </p>
      </div>
    </AdminShell>
  )
}

/** Cifra grande de la banda de resumen, con flecha a su detalle. */
function Cifra({ value, label, href }: { value: string; label: string; href: string }) {
  return (
    <a href={href} className="group block min-w-0">
      <span className="block truncate text-2xl font-medium tracking-tight tabular-nums sm:text-3xl md:text-4xl" title={value}>{value}</span>
      <span className="mt-4 flex items-end justify-between gap-3 text-xs leading-snug text-[#17181a]/60">
        <span className="max-w-[9rem]">{label}</span>
        <ArrowRight size={18} className="shrink-0 text-[#17181a] transition group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </a>
  )
}
