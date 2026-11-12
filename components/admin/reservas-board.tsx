import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Mail, MoreVertical, Phone, Users } from 'lucide-react'
import { formatCents } from '@/lib/pricing'
import { BOOKING_STATUSES, BOOKING_STATUS_LABEL, toSearchParams, type AdminFilters } from '@/lib/admin/filters'
import type { ReservaRow } from '@/lib/admin/metrics'

/**
 * Tablero de reservas por estado: una columna por estado, una tarjeta por
 * reserva, como un kanban.
 *
 * Responde de un vistazo a «¿qué tengo pendiente de cobro y qué ya está
 * confirmado?», que en la tabla exige leer la columna de estado fila a
 * fila. NO mueve reservas entre columnas: el estado lo cambian el pago y
 * el cierre automático (lib/admin/lifecycle.ts), no el administrador. La
 * tabla de abajo sigue siendo la vista completa.
 *
 * Al pasar el ratón (o enfocar) una tarjeta se invierte a tinta y muestra
 * el contacto del cliente, como la tarjeta destacada de la referencia.
 */

/** Tarjetas por columna antes de mandar a la tabla filtrada. */
const POR_COLUMNA = 6

function fechaCorta(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' })
}

export function ReservasBoard({ rows, filters }: { rows: ReservaRow[]; filters: AdminFilters }) {
  // Si ya se filtró por un estado, solo tiene sentido su columna.
  const estados = filters.status ? [filters.status] : BOOKING_STATUSES

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [scrollbar-width:thin]">
      <div className="grid min-w-max auto-cols-[17rem] grid-flow-col gap-4 xl:min-w-0 xl:auto-cols-auto xl:grid-flow-row xl:grid-cols-5">
        {estados.map((estado) => {
          const items = rows.filter((row) => row.status === estado)
          const extra = items.length - POR_COLUMNA
          const verTodas = new URLSearchParams(toSearchParams({ ...filters, status: estado }))
          return (
            <section key={estado} aria-labelledby={`col-${estado}`} className="min-w-0">
              <header className="mb-3 flex items-center justify-between gap-2">
                <h3 id={`col-${estado}`} className="text-lg font-medium tracking-tight">
                  {BOOKING_STATUS_LABEL[estado]}
                </h3>
                <span className="rounded-lg border border-[#dcdcd6] px-2 py-0.5 text-sm tabular-nums">{items.length}</span>
              </header>

              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#dcdcd6] px-4 py-6 text-center text-xs text-[#17181a]/50">
                  Sin reservas
                </p>
              ) : (
                <ul className="grid gap-3">
                  {items.slice(0, POR_COLUMNA).map((row) => (
                    <li key={row.id}>
                      <BoardCard row={row} muted={estado === 'COMPLETED' || estado === 'CANCELLED'} />
                    </li>
                  ))}
                </ul>
              )}

              {extra > 0 && (
                <Link
                  href={`/admin?${verTodas.toString()}#reservas`}
                  className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-[#dcdcd6] py-2 text-xs font-medium transition hover:bg-white"
                >
                  Ver {extra} más <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function BoardCard({ row, muted }: { row: ReservaRow; muted: boolean }) {
  return (
    <Link
      href={`/admin/reservas/${row.code}`}
      className={`group block rounded-2xl border p-4 transition duration-200 hover:border-[#17181a] hover:bg-[#17181a] hover:text-white focus-visible:border-[#17181a] focus-visible:bg-[#17181a] focus-visible:text-white focus-visible:outline-none ${
        muted ? 'border-transparent bg-[#efefea]' : 'border-[#e3e3de] bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-medium">{row.customerName}</p>
        <MoreVertical size={16} className="mt-0.5 shrink-0 opacity-60" aria-hidden="true" />
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#17181a]/65 group-hover:text-white/70 group-focus-visible:text-white/70">
        {row.experienceTitle} · {row.destination}
      </p>

      {/* Contacto: solo en la tarjeta activa, como en la referencia. */}
      <div className="hidden space-y-1.5 pt-3 text-xs text-white/80 group-hover:block group-focus-visible:block">
        <p className="flex items-center gap-2 truncate">
          <Mail size={13} className="shrink-0" aria-hidden="true" /> {row.customerEmail}
        </p>
        {row.customerPhone && (
          <p className="flex items-center gap-2">
            <Phone size={13} className="shrink-0" aria-hidden="true" /> {row.customerPhone}
          </p>
        )}
        <p className="font-mono text-[11px] text-white/60">{row.code}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcdcd6] px-2 py-1 text-[11px] font-medium group-hover:border-white/30 group-focus-visible:border-white/30">
          <CalendarDays size={12} aria-hidden="true" />
          {fechaCorta(row.date)}
        </span>
        <span className="flex items-center gap-2.5 text-[11px] tabular-nums">
          <span className="flex items-center gap-1" title="Personas">
            <Users size={12} aria-hidden="true" /> {row.people}
          </span>
          <span className="font-semibold">{formatCents(row.totalCents, row.currency)}</span>
        </span>
      </div>
      {row.isTest && (
        <span className="mt-2 inline-block rounded bg-gold-pale px-1.5 py-0.5 text-[10px] font-bold text-gold-ink">PRUEBA</span>
      )}
    </Link>
  )
}
