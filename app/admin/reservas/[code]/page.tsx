import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CreditCard, Receipt, User } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/session'
import { getPagosDeReserva, getReserva, PAYMENT_PROVIDER_LABEL } from '@/lib/admin/metrics'
import { PAYMENT_STATUS_LABEL, type PaymentStatusFilter } from '@/lib/admin/filters'
import { formatCents } from '@/lib/pricing'
import { AdminShell } from '@/components/admin/admin-shell'
import { EstadoReservaBadge, fechaHora, fechaLarga } from '@/components/admin/reservas-table'

/**
 * Detalle de una reserva.
 *
 * Todo lo que se muestra sale de la fila de `bookings` y de sus
 * `payments`. Se listan TODOS los intentos de pago, no solo el bueno:
 * cuando un cliente reclama, lo que hace falta saber es qué se intentó,
 * qué respondió la pasarela y por qué falló.
 *
 * Se busca por `code` (EES-XXXXXX) y no por id interno: es el número que
 * el cliente tiene delante cuando escribe o llama.
 */

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Params) {
  const { code } = await params
  return { title: `Reserva ${code}`, robots: { index: false, follow: false } }
}

export default async function ReservaDetallePage({ params }: Params) {
  const { code } = await params
  const admin = await requireAdmin(`/admin/reservas/${code}`)

  const reserva = await getReserva(code)
  if (!reserva) notFound()

  const pagos = await getPagosDeReserva(reserva.id)

  return (
    <AdminShell admin={admin}>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b8481c] hover:underline">
        <ArrowLeft size={15} /> Volver al panel
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#173f45] md:text-3xl">{reserva.experienceTitle}</h1>
          <p className="mt-1 font-mono text-sm text-[#6a8588]">{reserva.code}</p>
        </div>
        <div className="flex items-center gap-2">
          {reserva.isTest && (
            <span className="rounded-full border border-[#e2c483] bg-[#fdf2dc] px-3 py-1 text-xs font-bold text-[#8a5d0c]">
              RESERVA DE PRUEBA
            </span>
          )}
          <EstadoReservaBadge status={reserva.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Experiencia -------------------------------------------- */}
        <Bloque titulo="Experiencia" icon={Receipt}>
          <Campo label="Experiencia" value={reserva.experienceTitle} />
          <Campo label="Lugar" value={reserva.destination} />
          <Campo label="Fecha" value={fechaLarga(reserva.date)} capitalize />
          <Campo
            label="Hora"
            value={null}
            nota={
              reserva.durationHours
                ? `No registrada. Duración: ${reserva.durationHours} h.`
                : 'No registrada en el modelo de datos.'
            }
          />
          <Campo label="Personas" value={String(reserva.people)} />
        </Bloque>

        {/* Cliente ------------------------------------------------- */}
        <Bloque titulo="Cliente" icon={User}>
          <Campo label="Nombre" value={reserva.customerName} />
          <Campo label="Correo" value={reserva.customerEmail} />
          <Campo label="Teléfono" value={reserva.customerPhone} />
          <Campo label="País" value={reserva.customerCountry} />
          <Campo
            label="Cuenta"
            value={reserva.hasAccount ? 'Reservó con su cuenta' : 'Compra sin registro'}
          />
        </Bloque>

        {/* Importes ------------------------------------------------ */}
        <Bloque titulo="Importes" icon={CreditCard}>
          <Campo label="Precio por persona" value={formatCents(reserva.unitPriceCents, reserva.currency)} />
          <Campo
            label="Subtotal"
            value={formatCents(reserva.unitPriceCents * reserva.people, reserva.currency)}
          />
          <Campo
            label="Descuento"
            value={reserva.discountCents > 0 ? `−${formatCents(reserva.discountCents, reserva.currency)}` : 'Sin descuento'}
          />
          <Campo label="Total" value={formatCents(reserva.totalCents, reserva.currency)} destacado />
          <Campo label="Creada" value={fechaHora(reserva.createdAt)} />
          <Campo label="Pagada" value={reserva.paidAt ? fechaHora(reserva.paidAt) : null} />
        </Bloque>
      </div>

      {/* Pagos ---------------------------------------------------- */}
      <section aria-labelledby="pagos" className="mt-8">
        <h2 id="pagos" className="mb-3 text-sm font-bold uppercase tracking-[.12em] text-[#759096]">
          Intentos de pago ({pagos.length})
        </h2>

        {pagos.length === 0 ? (
          <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-[#6a8588] shadow-[0_8px_30px_rgba(26,65,69,.06)]">
            Esta reserva no llegó a generar ningún intento de pago.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.06)]">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[#edf0ed] text-xs uppercase tracking-[.1em] text-[#759096]">
                  <th scope="col" className="px-4 py-3 font-bold">Método</th>
                  <th scope="col" className="px-4 py-3 font-bold">Entorno</th>
                  <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Importe</th>
                  <th scope="col" className="px-4 py-3 font-bold">Referencia</th>
                  <th scope="col" className="px-4 py-3 font-bold">Transacción</th>
                  <th scope="col" className="px-4 py-3 font-bold">Creado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-b border-[#f3f6f4] last:border-0">
                    <th scope="row" className="px-4 py-3 font-semibold text-[#173f45]">
                      {PAYMENT_PROVIDER_LABEL[pago.provider] ?? pago.provider}
                    </th>
                    <td className="px-4 py-3 text-[#547176]">{pago.environment}</td>
                    <td className="px-4 py-3 font-semibold text-[#547176]">
                      {PAYMENT_STATUS_LABEL[pago.status as PaymentStatusFilter] ?? pago.status}
                      {pago.failureReason && (
                        <span className="block text-xs font-normal text-[#a3341c]">{pago.failureReason}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#547176]">
                      {formatCents(pago.amountCents, pago.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6a8588]">{pago.reference}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6a8588]">
                      {pago.providerTransactionId ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6a8588]">{fechaHora(pago.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  )
}

function Bloque({
  titulo,
  icon: Icon,
  children,
}: {
  titulo: string
  icon: typeof User
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(26,65,69,.06)]">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em] text-[#759096]">
        <Icon size={15} /> {titulo}
      </h2>
      <dl className="mt-4 grid gap-3">{children}</dl>
    </section>
  )
}

function Campo({
  label,
  value,
  nota,
  capitalize = false,
  destacado = false,
}: {
  label: string
  value: string | null
  nota?: string
  capitalize?: boolean
  destacado?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#f3f6f4] pb-2.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs text-[#6a8588]">{label}</dt>
      <dd
        className={`min-w-0 break-words text-right ${capitalize ? 'capitalize ' : ''}${
          destacado ? 'text-lg font-semibold text-[#173f45]' : 'text-sm font-medium text-[#173f45]'
        }`}
      >
        {value ?? <span className="text-[#9ab0ad]">{nota ?? '—'}</span>}
      </dd>
    </div>
  )
}
