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
  PENDING_PAYMENT: 'bg-gold-pale text-gold-ink border-gold-line',
  PAID: 'bg-info-soft text-info border-info-line',
  CONFIRMED: 'bg-success-soft text-success-dark border-success-line',
  COMPLETED: 'bg-surface-soft text-muted border-line',
  CANCELLED: 'bg-accent-soft text-accent-deep border-accent-line',
}

const PAGO_CLASS: Record<string, string> = {
  APPROVED: 'text-success-dark',
  PENDING: 'text-gold-ink',
  DECLINED: 'text-accent-deep',
  REFUNDED: 'text-info',
  NONE: 'text-faint',
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
      {reserva.payLater && reserva.status === 'PENDING_PAYMENT' && (
        <span className="ml-1.5 rounded-full bg-surface-mint px-2 py-0.5 text-[11px] font-semibold text-brand" title={reserva.holdExpiresAt ? `Plazo: ${reserva.holdExpiresAt.toLocaleString('es-SV', { timeZone: 'America/El_Salvador' })}` : undefined}>
          Paga después
        </span>
      )}
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

const dash = <span className="text-faint">—</span>

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
      <h2 id={id} className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em] text-faint">
        <Users size={15} /> {title}
        <span className="font-normal normal-case tracking-normal text-faint">({rows.length})</span>
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-muted shadow-card">
          {emptyLabel}
        </p>
      ) : (
        <>
          {/* Fichas: móvil */}
          <ul className="grid gap-3 lg:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl bg-white p-4 shadow-card">
                <Link href={`/admin/reservas/${row.code}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand">{row.experienceTitle}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {row.customerName} · {row.customerEmail}
                      </p>
                    </div>
                    <EstadoReservaBadge status={row.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-mono">{row.code}</span> · {row.destination} ·{' '}
                    <span className="capitalize">{fechaLarga(row.date)}</span>
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Dato label="Personas" value={String(row.people)} />
                    <Dato label="Total" value={formatCents(row.totalCents, row.currency)} />
                    <div className="col-span-2">
                      <dt className="text-xs text-muted">Pago</dt>
                      <dd className="text-sm font-semibold text-brand">
                        <PagoTexto reserva={row} />
                        {row.isTest && <span className="ml-1.5 text-xs font-normal text-gold-ink">· prueba</span>}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tabla: escritorio */}
          {/*
            `overflow-x-auto`, no `hidden`: con doce columnas la tabla pide
            unos 1 520 px y en una pantalla de 1 440 las últimas (estado,
            creada, ver) quedaban recortadas SIN forma de llegar a ellas.
          */}
          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-card lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Reservas reales registradas, con cliente, fecha, importe, método y estado del pago.
              </caption>
              <thead>
                <tr className="border-b border-line-soft text-xs uppercase tracking-[.1em] text-faint">
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
                  <tr key={row.id} className="border-b border-surface-soft transition last:border-0 hover:bg-surface-soft">
                    <th scope="row" className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-brand">
                      {row.code}
                      {row.isTest && (
                        <span className="ml-1.5 rounded bg-gold-pale px-1.5 py-0.5 text-[10px] font-sans font-bold text-gold-ink">
                          PRUEBA
                        </span>
                      )}
                    </th>
                    <td className="max-w-[12rem] truncate px-3 py-3 text-brand">{row.experienceTitle}</td>
                    <td className="max-w-[13rem] px-3 py-3">
                      <span className="block truncate font-medium text-brand">{row.customerName}</span>
                      <span className="block truncate text-xs text-muted">{row.customerEmail}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 capitalize text-muted">{fechaLarga(row.date)}</td>
                    {/* Sin recorte, un destino de tres palabras parte en tres
                        líneas y estira toda la fila. */}
                    <td className="max-w-[9rem] truncate px-3 py-3 text-muted" title={row.destination}>
                      {row.destination}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-brand">{row.people}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted">
                      {formatCents(row.unitPriceCents, row.currency)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-brand">
                      {formatCents(row.totalCents, row.currency)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted"><PagoTexto reserva={row} /></td>
                    <td className="px-3 py-3"><EstadoReservaBadge status={row.status} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">{fechaHora(row.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/reservas/${row.code}`}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-accent transition hover:bg-accent-soft"
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
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-brand">{value ?? dash}</dd>
    </div>
  )
}
