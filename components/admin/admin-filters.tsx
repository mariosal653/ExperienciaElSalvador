import Link from 'next/link'
import { Filter, RotateCcw } from 'lucide-react'
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  hasFilters,
  type AdminFilters as Filters,
} from '@/lib/admin/filters'

/**
 * Filtros del panel.
 *
 * Es un `<form method="get">` normal, sin JavaScript: el navegador arma la
 * URL y Next.js vuelve a renderizar la página en el servidor con los
 * filtros ya aplicados. Así los KPIs, la tabla y los gráficos cambian
 * todos a la vez y de forma consistente —salen de la misma consulta— y la
 * vista filtrada se puede guardar en marcadores o compartir por enlace.
 *
 * Los atajos de mes y año son enlaces que escriben ?mes= o ?anio=, que
 * lib/admin/filters.ts traduce a un rango de fechas.
 */
export function AdminFilters({ filters, catalogo, destinos, hoy }: {
  filters: Filters
  catalogo: Array<{ id: string; titulo: string }>
  destinos: string[]
  hoy: string
}) {
  const mesActual = hoy.slice(0, 7)
  const anioActual = hoy.slice(0, 4)

  const field =
    'mt-1 w-full rounded-xl border border-[#dce7e1] bg-white px-3 py-2.5 text-sm text-[#173f45] outline-none transition focus:border-[#173f45] focus:ring-2 focus:ring-[#173f45]/15'
  const label = 'text-xs font-bold uppercase tracking-[.1em] text-[#759096]'

  return (
    <section aria-labelledby="filtros" className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(26,65,69,.06)] sm:p-5">
      <h2 id="filtros" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em] text-[#759096]">
        <Filter size={15} /> Filtros
      </h2>

      <form method="get" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="f-from" className={label}>Desde</label>
          <input id="f-from" type="date" name="from" defaultValue={filters.from ?? ''} className={field} />
        </div>
        <div>
          <label htmlFor="f-to" className={label}>Hasta</label>
          <input id="f-to" type="date" name="to" defaultValue={filters.to ?? ''} className={field} />
        </div>

        <div>
          <label htmlFor="f-exp" className={label}>Experiencia</label>
          <select id="f-exp" name="experiencia" defaultValue={filters.experienceId ?? ''} className={field}>
            <option value="">Todas</option>
            {catalogo.map((item) => (
              <option key={item.id} value={item.id}>{item.titulo}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-estado" className={label}>Estado de la reserva</label>
          <select id="f-estado" name="estado" defaultValue={filters.status ?? ''} className={field}>
            <option value="">Todos</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>{BOOKING_STATUS_LABEL[status]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-pago" className={label}>Estado del pago</label>
          <select id="f-pago" name="pago" defaultValue={filters.paymentStatus ?? ''} className={field}>
            <option value="">Todos</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>{PAYMENT_STATUS_LABEL[status]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-destino" className={label}>Ubicación</label>
          <select id="f-destino" name="destino" defaultValue={filters.destination ?? ''} className={field}>
            <option value="">Todas</option>
            {destinos.map((destino) => (
              <option key={destino} value={destino}>{destino}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#dce7e1] px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              name="solo"
              value="reales"
              defaultChecked={filters.onlyReal}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#b8481c]"
            />
            <span className="text-[#547176]">
              <span className="block font-semibold text-[#173f45]">Solo cobros reales</span>
              Deja fuera las reservas pagadas con la pasarela simulada o en sandbox.
            </span>
          </label>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="flex-1 rounded-full bg-[#173f45] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0e3035] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8481c]"
          >
            Aplicar
          </button>
          {hasFilters(filters) && (
            <Link
              href="/admin"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#dce7e1] text-[#547176] transition hover:bg-[#eaf1ed]"
              aria-label="Quitar todos los filtros"
              title="Quitar todos los filtros"
            >
              <RotateCcw size={16} />
            </Link>
          )}
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#edf0ed] pt-4">
        <span className="text-xs text-[#6a8588]">Atajos:</span>
        <Atajo href={`/admin?mes=${mesActual}`} label="Este mes" />
        <Atajo href={`/admin?anio=${anioActual}`} label={`Año ${anioActual}`} />
        <Atajo href={`/admin?from=${hoy}`} label="De hoy en adelante" />
        <Atajo href={`/admin?to=${hoy}`} label="Histórico" />
      </div>
    </section>
  )
}

function Atajo({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[#dce7e1] px-3 py-1.5 text-xs font-semibold text-[#173f45] transition hover:bg-[#eaf1ed]"
    >
      {label}
    </Link>
  )
}
