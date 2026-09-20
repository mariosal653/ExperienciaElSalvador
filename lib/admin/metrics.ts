import { prisma } from '../db'
import { experiences, type Experience } from '../data'
import { todayInElSalvador } from '../dates'
import type { AdminFilters } from './filters'

/**
 * Métricas del panel. SOLO SERVIDOR.
 *
 * TODO sale de datos reales: las reservas de la base y el catálogo de
 * lib/data.ts. No hay valores de ejemplo, ni de relleno, ni estimaciones.
 * Cuando algo no se puede calcular con lo que hay guardado, no se muestra
 * (ver `SIN DATO` más abajo).
 *
 * ---------------------------------------------------------------------
 * QUÉ ES UNA «SALIDA»
 * ---------------------------------------------------------------------
 * El catálogo no tiene fechas: una experiencia sale los días de la semana
 * definidos en lib/data.ts. La unidad con fecha real es la SALIDA, o sea
 * el par (experiencia, día). Es lo mismo que usa lib/availability.ts para
 * el cupo, y es lo que el panel lista como «experiencias».
 *
 * ---------------------------------------------------------------------
 * QUÉ CUENTA COMO INGRESO
 * ---------------------------------------------------------------------
 * Solo las reservas con el cobro aprobado (PAID, CONFIRMED o COMPLETED).
 * Una reserva en PENDING_PAYMENT no es dinero: es una intención.
 *
 * Además, por defecto se EXCLUYEN las reservas marcadas `isTest` —las que
 * nacieron con la pasarela simulada o en sandbox—. Sumarlas daría unos
 * ingresos que no existen. El panel deja incluirlas a propósito con el
 * filtro «Incluir pruebas», y entonces lo advierte en pantalla.
 *
 * ---------------------------------------------------------------------
 * SIN DATO
 * ---------------------------------------------------------------------
 * - HORA de la salida: el modelo guarda `date` (AAAA-MM-DD), no la hora.
 *   El panel muestra la duración del catálogo, que sí existe.
 * - El estado COMPLETED no lo pone nadie automáticamente, así que
 *   «finalizada» se deduce de la fecha, no del estado de la reserva.
 */

/** Estados de reserva que representan dinero ya cobrado. */
const PAID_STATUSES = ['PAID', 'CONFIRMED', 'COMPLETED'] as const

export type SalidaStatus = 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA'

export const SALIDA_STATUS_LABEL: Record<SalidaStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

export type Kpis = {
  salidasRealizadas: number
  salidasProximas: number
  personasAtendidas: number
  personasReservadas: number
  ingresosCents: number
  reservasTotales: number
  reservasPendientes: number
  reservasCanceladas: number
  /** Reservas de prueba que quedaron FUERA del cálculo. 0 si se incluyen. */
  reservasDePruebaExcluidas: number
}

export type SalidaRow = {
  key: string
  experienceId: string
  titulo: string
  destino: string
  fecha: string
  duracionHoras: number | null
  precioUnitarioCents: number | null
  capacidad: number | null
  personas: number
  cuposDisponibles: number | null
  reservas: number
  ingresoCents: number
  estado: SalidaStatus
}

export type ExperienceComparison = {
  experienceId: string
  titulo: string
  personas: number
  ingresoCents: number
  reservas: number
  salidas: number
  /** Ocupación media 0–1. null cuando no hay cupo conocido para sus salidas. */
  ocupacion: number | null
  promedioPersonasPorSalida: number | null
  ingresoMedioPorReservaCents: number | null
}

export type AdminDashboard = {
  kpis: Kpis
  proximas: SalidaRow[]
  salidas: SalidaRow[]
  comparativa: ExperienceComparison[]
  tasaCancelacion: number | null
  hoy: string
  /** Experiencias del catálogo, para el desplegable del filtro. */
  catalogo: Array<{ id: string; titulo: string; destino: string }>
  destinos: string[]
  /** true cuando no hay ninguna reserva que cumpla el filtro. */
  vacio: boolean
}

type BookingRow = {
  id: string
  experienceId: string
  experienceTitle: string
  destination: string
  date: string
  people: number
  totalCents: number
  status: string
  isTest: boolean
}

function byId(id: string): Experience | undefined {
  return experiences.find((item) => item.id === id)
}

/** Cláusula WHERE de Prisma a partir de los filtros de la interfaz. */
function whereFrom(filters: AdminFilters) {
  const where: Record<string, unknown> = {}

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    }
  }
  if (filters.experienceId) where.experienceId = filters.experienceId
  if (filters.destination) where.destination = filters.destination
  if (filters.status) where.status = filters.status
  if (!filters.includeTest) where.isTest = false

  return where
}

/**
 * Todo lo que pinta el panel, en una sola pasada.
 *
 * Se traen las reservas que cumplen el filtro y se agregan en memoria. Es
 * un negocio con decenas o cientos de reservas, no millones: hacerlo así
 * permite deducir el estado de cada salida y la ocupación sin lanzar una
 * consulta por experiencia y día. Si el volumen creciera, lo que habría
 * que cambiar es esta función, no la interfaz.
 */
export async function getDashboard(filters: AdminFilters): Promise<AdminDashboard> {
  const hoy = todayInElSalvador()

  const [bookings, pruebasExcluidas] = await Promise.all([
    prisma.booking.findMany({
      where: whereFrom(filters),
      select: {
        id: true,
        experienceId: true,
        experienceTitle: true,
        destination: true,
        date: true,
        people: true,
        totalCents: true,
        status: true,
        isTest: true,
      },
      orderBy: { date: 'asc' },
    }) as Promise<BookingRow[]>,

    // Cuántas quedaron fuera por ser de prueba: se dice en pantalla, para
    // que un cero no parezca un fallo.
    filters.includeTest
      ? Promise.resolve(0)
      : prisma.booking.count({ where: { ...whereFrom(filters), isTest: true } }),
  ])

  // Cupo real de cada salida implicada: una sola consulta para todas.
  const overrides = bookings.length
    ? await prisma.availability.findMany({
        where: { OR: bookings.map((b) => ({ experienceId: b.experienceId, date: b.date })) },
        select: { experienceId: true, date: true, capacity: true, closed: true },
      })
    : []
  const overrideBy = new Map(overrides.map((o) => [`${o.experienceId}|${o.date}`, o]))

  /* ---------------- agregación por salida ---------------- */

  type Acc = {
    experienceId: string
    titulo: string
    destino: string
    fecha: string
    personas: number
    reservas: number
    ingresoCents: number
    reservasNoCanceladas: number
    reservasConfirmadas: number
  }

  const salidasMap = new Map<string, Acc>()
  const kpis: Kpis = {
    salidasRealizadas: 0,
    salidasProximas: 0,
    personasAtendidas: 0,
    personasReservadas: 0,
    ingresosCents: 0,
    reservasTotales: bookings.length,
    reservasPendientes: 0,
    reservasCanceladas: 0,
    reservasDePruebaExcluidas: pruebasExcluidas,
  }

  for (const booking of bookings) {
    const cobrada = (PAID_STATUSES as readonly string[]).includes(booking.status)

    if (booking.status === 'PENDING_PAYMENT') kpis.reservasPendientes += 1
    if (booking.status === 'CANCELLED') kpis.reservasCanceladas += 1

    if (cobrada) {
      kpis.personasReservadas += booking.people
      kpis.ingresosCents += booking.totalCents
      if (booking.date < hoy) kpis.personasAtendidas += booking.people
    }

    const key = `${booking.experienceId}|${booking.date}`
    const acc =
      salidasMap.get(key) ??
      {
        experienceId: booking.experienceId,
        titulo: booking.experienceTitle,
        destino: booking.destination,
        fecha: booking.date,
        personas: 0,
        reservas: 0,
        ingresoCents: 0,
        reservasNoCanceladas: 0,
        reservasConfirmadas: 0,
      }

    acc.reservas += 1
    if (booking.status !== 'CANCELLED') acc.reservasNoCanceladas += 1
    if (cobrada) {
      acc.personas += booking.people
      acc.ingresoCents += booking.totalCents
      acc.reservasConfirmadas += 1
    }
    salidasMap.set(key, acc)
  }

  const salidas: SalidaRow[] = [...salidasMap.values()]
    .map((acc) => {
      const catalogo = byId(acc.experienceId)
      const override = overrideBy.get(`${acc.experienceId}|${acc.fecha}`)

      const capacidad = override?.closed
        ? 0
        : (override?.capacity ?? catalogo?.maxPeople ?? null)

      const estado = estadoDeSalida(acc, override?.closed === true, acc.fecha, hoy)

      return {
        key: `${acc.experienceId}|${acc.fecha}`,
        experienceId: acc.experienceId,
        titulo: acc.titulo,
        destino: acc.destino,
        fecha: acc.fecha,
        duracionHoras: catalogo?.durationHours ?? null,
        precioUnitarioCents: catalogo ? Math.round(catalogo.priceUsd * 100) : null,
        capacidad,
        personas: acc.personas,
        cuposDisponibles: capacidad === null ? null : Math.max(0, capacidad - acc.personas),
        reservas: acc.reservas,
        ingresoCents: acc.ingresoCents,
        estado,
      }
    })
    .sort((a, b) => (a.fecha === b.fecha ? a.titulo.localeCompare(b.titulo) : a.fecha.localeCompare(b.fecha)))

  for (const salida of salidas) {
    if (salida.estado === 'FINALIZADA') kpis.salidasRealizadas += 1
    if (salida.estado === 'CONFIRMADA' || salida.estado === 'PENDIENTE' || salida.estado === 'EN_CURSO') {
      kpis.salidasProximas += 1
    }
  }

  /* ---------------- comparativa por experiencia ---------------- */

  const comparativaMap = new Map<string, ExperienceComparison & { capacidadTotal: number; capacidadConocida: boolean }>()

  for (const salida of salidas) {
    const item =
      comparativaMap.get(salida.experienceId) ??
      {
        experienceId: salida.experienceId,
        titulo: salida.titulo,
        personas: 0,
        ingresoCents: 0,
        reservas: 0,
        salidas: 0,
        ocupacion: null,
        promedioPersonasPorSalida: null,
        ingresoMedioPorReservaCents: null,
        capacidadTotal: 0,
        capacidadConocida: true,
      }

    item.personas += salida.personas
    item.ingresoCents += salida.ingresoCents
    item.reservas += salida.reservas
    item.salidas += 1
    if (salida.capacidad === null) item.capacidadConocida = false
    else item.capacidadTotal += salida.capacidad

    comparativaMap.set(salida.experienceId, item)
  }

  const comparativa: ExperienceComparison[] = [...comparativaMap.values()]
    .map(({ capacidadTotal, capacidadConocida, ...item }) => ({
      ...item,
      ocupacion: capacidadConocida && capacidadTotal > 0 ? item.personas / capacidadTotal : null,
      promedioPersonasPorSalida: item.salidas > 0 ? item.personas / item.salidas : null,
      ingresoMedioPorReservaCents: item.reservas > 0 ? Math.round(item.ingresoCents / item.reservas) : null,
    }))
    .sort((a, b) => b.ingresoCents - a.ingresoCents || b.personas - a.personas)

  const proximas = salidas
    .filter((salida) => salida.fecha >= hoy && salida.estado !== 'CANCELADA')
    .slice(0, 12)

  return {
    kpis,
    proximas,
    salidas,
    comparativa,
    tasaCancelacion: kpis.reservasTotales > 0 ? kpis.reservasCanceladas / kpis.reservasTotales : null,
    hoy,
    catalogo: experiences.map((item) => ({ id: item.id, titulo: item.title, destino: item.destination })),
    destinos: [...new Set(experiences.map((item) => item.destination))].sort(),
    vacio: bookings.length === 0,
  }
}

/**
 * Estado de una salida, deducido de sus reservas y de la fecha.
 *
 * No inventa una nomenclatura nueva: reutiliza la de BookingStatus
 * (pendiente / confirmada / cancelada) y añade las dos que dependen del
 * calendario y no del pago: «en curso» (es hoy) y «finalizada» (ya pasó).
 * Hace falta deducirlas porque nada mueve las reservas a COMPLETED.
 */
function estadoDeSalida(
  acc: { reservasNoCanceladas: number; reservasConfirmadas: number },
  cerrada: boolean,
  fecha: string,
  hoy: string,
): SalidaStatus {
  // La fecha está cerrada en `availability`, o todas sus reservas se
  // cancelaron: esa salida no existe.
  if (cerrada || acc.reservasNoCanceladas === 0) return 'CANCELADA'

  if (fecha < hoy) {
    // Ya pasó. Si nadie llegó a pagar, no se realizó.
    return acc.reservasConfirmadas > 0 ? 'FINALIZADA' : 'CANCELADA'
  }

  if (fecha === hoy) return 'EN_CURSO'

  // Futura: confirmada en cuanto hay al menos un cobro aprobado.
  return acc.reservasConfirmadas > 0 ? 'CONFIRMADA' : 'PENDIENTE'
}
