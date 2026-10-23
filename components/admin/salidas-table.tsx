import { CalendarDays } from 'lucide-react'
import { formatCents } from '@/lib/pricing'
import { SALIDA_STATUS_LABEL, type SalidaRow, type SalidaStatus } from '@/lib/admin/metrics'

/**
 * Listado de salidas (experiencia + fecha).
 *
 * En pantallas anchas es una tabla; por debajo de `md` cada salida se
 * muestra como una ficha. No se usa scroll horizontal: en un móvil una
 * tabla de diez columnas es ilegible aunque se pueda arrastrar.
 *
 * La HORA no aparece porque el modelo de datos no la guarda: las reservas
 * tienen `date` (AAAA-MM-DD). En su lugar se muestra la duración, que sí
 * está en el catálogo. Inventar una hora sería inventar un dato.
 */

const ESTADO_CLASS: Record<SalidaStatus, string> = {
  PENDIENTE: 'bg-gold-pale text-gold-ink border-gold-line',
  CONFIRMADA: 'bg-success-soft text-success-dark border-success-line',
  EN_CURSO: 'bg-info-soft text-info border-info-line',
  FINALIZADA: 'bg-surface-soft text-muted border-line',
  CANCELADA: 'bg-accent-soft text-accent-deep border-accent-line',
}

function EstadoBadge({ estado }: { estado: SalidaStatus }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${ESTADO_CLASS[estado]}`}>
      {SALIDA_STATUS_LABEL[estado]}
    </span>
  )
}

function fecha(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const dash = <span className="text-faint">—</span>

export function SalidasTable({
  rows,
  title,
  emptyLabel,
  caption,
}: {
  rows: SalidaRow[]
  title: string
  emptyLabel: string
  caption?: string
}) {
  return (
    <section aria-labelledby={`tabla-${title.replace(/\s+/g, '-').toLowerCase()}`} className="min-w-0">
      <h2
        id={`tabla-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em] text-faint"
      >
        <CalendarDays size={15} /> {title}
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-muted shadow-card">
          {emptyLabel}
        </p>
      ) : (
        <>
          {/* Fichas: móvil y tablet estrecha */}
          <ul className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.key} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand">{row.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {row.destino} · <span className="capitalize">{fecha(row.fecha)}</span>
                    </p>
                  </div>
                  <EstadoBadge estado={row.estado} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Dato label="Personas" value={String(row.personas)} />
                  <Dato label="Reservas" value={String(row.reservas)} />
                  <Dato label="Cupos libres" value={row.cuposDisponibles === null ? null : String(row.cuposDisponibles)} />
                  <Dato label="Ingreso" value={formatCents(row.ingresoCents)} />
                </dl>
              </li>
            ))}
          </ul>

          {/* Tabla: escritorio */}
          {/* Igual que en reservas-table: once columnas no caben siempre. */}
          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              {caption && <caption className="sr-only">{caption}</caption>}
              <thead>
                <tr className="border-b border-line-soft text-xs uppercase tracking-[.1em] text-faint">
                  <th scope="col" className="px-4 py-3 font-bold">Experiencia</th>
                  <th scope="col" className="px-4 py-3 font-bold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ubicación</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Duración</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Precio</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Cupo</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Personas</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Libres</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Reservas</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Ingreso</th>
                  <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-surface-soft last:border-0">
                    <th scope="row" className="max-w-[14rem] truncate px-4 py-3 font-semibold text-brand">
                      {row.titulo}
                    </th>
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-muted">{fecha(row.fecha)}</td>
                    <td className="max-w-[9rem] truncate px-4 py-3 text-muted" title={row.destino}>
                      {row.destino}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {row.durationHours === null ? dash : `${row.durationHours} h`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {row.precioUnitarioCents === null ? dash : formatCents(row.precioUnitarioCents)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {row.capacidad === null ? dash : row.capacidad}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand">{row.personas}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {row.cuposDisponibles === null ? dash : row.cuposDisponibles}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{row.reservas}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand">
                      {formatCents(row.ingresoCents)}
                    </td>
                    <td className="px-4 py-3"><EstadoBadge estado={row.estado} /></td>
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
