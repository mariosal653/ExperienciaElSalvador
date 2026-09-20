import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { formatCents } from '@/lib/pricing'
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL, type BookingStatusFilter } from '@/lib/admin/filters'
import { PAYMENT_PROVIDER_LABEL, type ReservaRow } from '@/lib/admin/metrics'

/**
 * Listado de RESERVAS: una fila por compra, con su cliente y su pago.
 *
 * Es la vista que responde «¿quién reservó, cuándo, cuánto pagó y cómo?».
 * La otra tabla del panel agrupa por salida y responde «¿qué
 * experiencias se han hecho?». Las dos salen de la misma consulta.
 *
 * En pantallas anchas es una tabla; por debajo de `md`, fichas. Nada de
 * scroll horizontal: una tabla de doce columnas en un móvil es ilegible
 * aunque se pueda arrastrar.
 *
 * La HORA de la experiencia no aparece porque no existe en el modelo: las
 * reservas guardan `date` (AAAA-MM-DD) y el catálogo la duración, no la
 * hora de inicio. Se muestra la duración, que sí es un dato real.
 */

const ESTADO_CLASS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-[#fdf2dc] text-[#8a5d0c] border-[#e2c483]',
  PAID: 'bg-[#e6eff5] text-[#1c5a80] border-[#a9c8dc]',
  CONFIRMED: 'bg-[#e3f0e9] text-[#256b54] border-[#a4cdbc]',
  COMPLETED: 'bg-[#eef2f0] text-[#4d6b6f] border-[#cfdad6]',
  CANCELLED: 'bg-[#fae6e0] text-[#a3341c] border-[#e3b5a7]',
}

const PAGO_CLASS: Record<string, string> = {
  APPROVED: 'text-[#256b54]',
  PENDING: 'text-[#8a5d0c]',
  DECLINED: 'text-[#a3341c]',
  REFUNDED: 'text-[#1c5a80]',
  NONE: 'text-[#9ab0ad]',
}

export function EstadoReservaBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        ESTADO_CLASS[status] ?? ESTADO_CLASS.COMPLETED
      }`}
    >
      {BOOKING_STATUS_LABEL[status as BookingStatusFilter] ?? status}
    </span>
  )
}

export function PagoTexto({ reserva }: { reserva: ReservaRow }) {
  const metodo = reserva.paymentProvider
    ? (PAYMENT_PROVIDER_LABEL[reserva.paymentProvider] ?? reserva.paymentProvider)
    : '—'
  return (
    <span className="whitespace-nowrap">
      {metodo}
      <span className={`ml-1.5 font-semibold ${PAGO_CLASS[reserva.paymentStatus] ?? ''}`}>
        {PAYMENT_STATUS_LABEL[reserva.paymentStatus]}
      </span>
    </span>
  )
}

export function fechaLarga(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function fechaHora(value: Date): string {
  return value.toLocaleString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dash = <span className="text-[#9ab0ad]">—</span>

export function ReservasTable({
  rows,
  title,
  emptyLabel,
}: {
  rows: ReservaRow[]
  title: string
  emptyLabel: string
}) {
  const id = `tabla-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em] text-[#759096]">
        <Users size={15} /> {title}
        <span className="font-normal normal-case tracking-normal text-[#9ab0ad]">({rows.length})</span>
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-[#6a8588] shadow-[0_8px_30px_rgba(26,65,69,.06)]">
          {emptyLabel}
        </p>
      ) : (
        <>
          {/* Fichas: móvil */}
          <ul className="grid gap-3 lg:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(26,65,69,.06)]">
                <Link href={`/admin/reservas/${row.code}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#173f45]">{row.experienceTitle}</p>
                      <p className="mt-0.5 truncate text-xs text-[#6a8588]">
                        {row.customerName} · {row.customerEmail}
                      </p>
                    </div>
                    <EstadoReservaBadge status={row.status} />
                  </div>
                  <p className="mt-2 text-xs text-[#6a8588]">
                    <span className="font-mono">{row.code}</span> · {row.destination} ·{' '}
                    <span className="capitalize">{fechaLarga(row.date)}</span>
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Dato label="Personas" value={String(row.people)} />
                    <Dato label="Total" value={formatCents(row.totalCents, row.currency)} />
                    <div className="col-span-2">
                      <dt className="text-xs text-[#6a8588]">Pago</dt>
                      <dd className="text-sm font-semibold text-[#173f45]">
                        <PagoTexto reserva={row} />
                        {row.isTest && <span className="ml-1.5 text-xs font-normal text-[#8a5d0c]">· prueba</span>}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tabla: escritorio */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.06)] lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Reservas reales registradas, con cliente, fecha, importe, método y estado del pago.
              </caption>
              <thead>
                <tr className="border-b border-[#edf0ed] text-xs uppercase tracking-[.1em] text-[#759096]">
                  <th scope="col" className="px-3 py-3 font-bold">Reserva</th>
                  <th scope="col" className="px-3 py-3 font-bold">Experiencia</th>
                  <th scope="col" className="px-3 py-3 font-bold">Cliente</th>
                  <th scope="col" className="px-3 py-3 font-bold">Fecha</th>
                  <th scope="col" className="px-3 py-3 font-bold">Lugar</th>
                  <th scope="col" className="px-3 py-3 text-right font-bold">Pax</th>
                  <th scope="col" className="px-3 py-3 text-right font-bold">Precio</th>
                  <th scope="col" className="px-3 py-3 text-right font-bold">Total</th>
                  <th scope="col" className="px-3 py-3 font-bold">Pago</th>
                  <th scope="col" className="px-3 py-3 font-bold">Estado</th>
                  <th scope="col" className="px-3 py-3 font-bold">Creada</th>
                  <th scope="col" className="px-3 py-3"><span className="sr-only">Detalle</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f3f6f4] transition last:border-0 hover:bg-[#f7faf8]">
                    <th scope="row" className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-[#173f45]">
                      {row.code}
                      {row.isTest && (
                        <span className="ml-1.5 rounded bg-[#fdf2dc] px-1.5 py-0.5 text-[10px] font-sans font-bold text-[#8a5d0c]">
                          PRUEBA
                        </span>
                      )}
                    </th>
                    <td className="max-w-[12rem] truncate px-3 py-3 text-[#173f45]">{row.experienceTitle}</td>
                    <td className="max-w-[13rem] px-3 py-3">
                      <span className="block truncate font-medium text-[#173f45]">{row.customerName}</span>
                      <span className="block truncate text-xs text-[#6a8588]">{row.customerEmail}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 capitalize text-[#547176]">{fechaLarga(row.date)}</td>
                    <td className="px-3 py-3 text-[#547176]">{row.destination}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-[#173f45]">{row.people}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#547176]">
                      {formatCents(row.unitPriceCents, row.currency)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-[#173f45]">
                      {formatCents(row.totalCents, row.currency)}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#547176]"><PagoTexto reserva={row} /></td>
                    <td className="px-3 py-3"><EstadoReservaBadge status={row.status} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#6a8588]">{fechaHora(row.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/reservas/${row.code}`}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[#b8481c] transition hover:bg-[#fae6e0]"
                      >
                        Ver <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function Dato({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-[#6a8588]">{label}</dt>
      <dd className="font-semibold tabular-nums text-[#173f45]">{value ?? dash}</dd>
    </div>
  )
}
