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
  PENDIENTE: 'bg-[#fdf2dc] text-[#8a5d0c] border-[#e2c483]',
  CONFIRMADA: 'bg-[#e3f0e9] text-[#256b54] border-[#a4cdbc]',
  EN_CURSO: 'bg-[#e6eff5] text-[#1c5a80] border-[#a9c8dc]',
  FINALIZADA: 'bg-[#eef2f0] text-[#4d6b6f] border-[#cfdad6]',
  CANCELADA: 'bg-[#fae6e0] text-[#a3341c] border-[#e3b5a7]',
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

const dash = <span className="text-[#9ab0ad]">—</span>

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
        className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em] text-[#759096]"
      >
        <CalendarDays size={15} /> {title}
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-[#6a8588] shadow-[0_8px_30px_rgba(26,65,69,.06)]">
          {emptyLabel}
        </p>
      ) : (
        <>
          {/* Fichas: móvil y tablet estrecha */}
          <ul className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.key} className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(26,65,69,.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#173f45]">{row.titulo}</p>
                    <p className="mt-0.5 text-xs text-[#6a8588]">
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
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.06)] md:block">
            <table className="w-full text-left text-sm">
              {caption && <caption className="sr-only">{caption}</caption>}
              <thead>
                <tr className="border-b border-[#edf0ed] text-xs uppercase tracking-[.1em] text-[#759096]">
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
                  <tr key={row.key} className="border-b border-[#f3f6f4] last:border-0">
                    <th scope="row" className="max-w-[14rem] truncate px-4 py-3 font-semibold text-[#173f45]">
                      {row.titulo}
                    </th>
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-[#547176]">{fecha(row.fecha)}</td>
                    <td className="px-4 py-3 text-[#547176]">{row.destino}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {row.durationHours === null ? dash : `${row.durationHours} h`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {row.precioUnitarioCents === null ? dash : formatCents(row.precioUnitarioCents)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {row.capacidad === null ? dash : row.capacidad}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#173f45]">{row.personas}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {row.cuposDisponibles === null ? dash : row.cuposDisponibles}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">{row.reservas}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#173f45]">
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
      <dt className="text-xs text-[#6a8588]">{label}</dt>
      <dd className="font-semibold tabular-nums text-[#173f45]">{value ?? dash}</dd>
    </div>
  )
}
