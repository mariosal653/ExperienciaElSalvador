import { prisma } from '../db'
import { todayInElSalvador } from '../dates'

/**
 * Cierre de reservas cuya fecha ya pasó. SOLO SERVIDOR.
 *
 * EL PROBLEMA QUE RESUELVE
 * El ciclo de vida documentado en prisma/schema.prisma es
 *
 *   PENDING_PAYMENT → PAID → CONFIRMED → COMPLETED
 *
 * pero el último paso no lo daba nadie: `finalizeBooking` deja la reserva
 * en CONFIRMED y ahí se quedaba para siempre. Consecuencias reales:
 *   - el panel no podía decir cuántas experiencias se habían completado;
 *   - `POST /api/reviews` exige COMPLETED, así que ningún cliente podía
 *     dejar una opinión de una experiencia a la que sí fue.
 *
 * QUÉ HACE
 * Pasa a COMPLETED las reservas CONFIRMED cuya fecha es anterior a hoy en
 * El Salvador. Nada más: no toca las canceladas, ni las que no llegaron a
 * pagarse, ni las de hoy o de mañana.
 *
 * Es IDEMPOTENTE: un `updateMany` condicionado al estado. Ejecutarlo diez
 * veces seguidas o desde dos procesos a la vez deja el mismo resultado y
 * no vuelve a escribir `completedAt`.
 *
 * DÓNDE SE LLAMA
 * Al cargar el panel. No hace falta un proceso programado —que este
 * despliegue no tiene— y el coste es un UPDATE que casi siempre afecta a
 * cero filas. Si algún día hay tareas programadas, este es el sitio del
 * que tirar.
 */
export async function completeElapsedBookings(now = new Date()): Promise<number> {
  const hoy = todayInElSalvador(now)

  const result = await prisma.booking.updateMany({
    where: {
      status: 'CONFIRMED',
      // Comparación de cadenas AAAA-MM-DD: orden lexicográfico = cronológico.
      date: { lt: hoy },
    },
    data: { status: 'COMPLETED', completedAt: now },
  })

  return result.count
}
