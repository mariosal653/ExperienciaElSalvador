import { prisma } from '../db'
import { experiences, type Experience } from '../data'
import { todayInElSalvador } from '../dates'
import type { AdminFilters, PaymentStatusFilter } from './filters'

/**
 * Métricas del panel. SOLO SERVIDOR.
 *
 * TODO sale de datos reales: la tabla `bookings` con sus `payments`, y el
 * catálogo de lib/data.ts para los datos que no se copian en la reserva
 * (cupo y duración). No hay valores de ejemplo, ni de relleno, ni
 * estimaciones. Cuando algo no se puede calcular con lo que hay guardado,
 * no se muestra (ver «SIN DATO»).
 *
 * ---------------------------------------------------------------------
 * DOS NIVELES DE LECTURA
 * ---------------------------------------------------------------------
 * RESERVA   una compra: un cliente, una fecha, N personas, un importe.
 *           Es la fila que el administrador necesita para responder
 *           «¿quién vino y cuánto pagó?».
 *
 * SALIDA    una experiencia en una fecha concreta (experienceId + date).
 *           El catálogo no tiene fechas: una experiencia sale los días de
 *           la semana definidos en lib/data.ts. La salida es la unidad
 *           que tiene cupo, y es la misma que usa lib/availability.ts.
 *           Varias reservas de distintos clientes caen en la misma salida.
 *
 * Los dos se calculan de la MISMA lectura, así que no pueden
 * contradecirse: una reserva se cuenta una vez como reserva y su gente
 * una vez dentro de su salida. Nunca se suma el importe total y además el
 * precio por persona: el importe de la reserva ya es el total cobrado.
 *
 * ---------------------------------------------------------------------
 * QUÉ CUENTA COMO INGRESO
 * ---------------------------------------------------------------------
 * Solo las reservas con el cobro aprobado (PAID, CONFIRMED o COMPLETED).
 * Una reserva en PENDING_PAYMENT es una intención, no dinero, y una
 * CANCELLED no es nada.
 *
 * Los ingresos se DESGLOSAN entre cobros reales y cobros de prueba
 * (`isTest`: pasarela simulada o sandbox). No se ocultan las reservas de
 * prueba —son actividad real de la aplicación y el administrador tiene
 * que verlas—, pero su dinero nunca se presenta como ingreso real.
 *
 * ---------------------------------------------------------------------
 * SIN DATO
 * ---------------------------------------------------------------------
 * - HORA de la salida: no existe en el modelo. Las reservas guardan
 *   `date` (AAAA-MM-DD) y el catálogo guarda la duración, no la hora de
 *   inicio. El panel muestra la duración y deja la hora en blanco. Para
 *   tenerla habría que añadirla al catálogo y decidirla el negocio;
 *   inventarla sería inventar un dato.
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

export const PAYMENT_PROVIDER_LABEL: Record<string, string> = {
  wompi: 'Wompi',
  paypal: 'PayPal',
  mock: 'Simulado',
}

export type Kpis = {
  salidasRealizadas: number
  salidasProximas: number
  personasAtendidas: number
  personasReservadas: number
  ingresosCents: number
  ingresosRealesCents: number
  ingresosPruebaCents: number
  reservasTotales: number
  reservasCompletadas: number
  reservasPendientes: number
  reservasCanceladas: number
  reservasDePrueba: number
}

/** Una reserva, con todo lo que el administrador necesita ver de ella. */
export type ReservaRow = {
  id: string
  code: string
  experienceId: string
  experienceTitle: string
  destination: string
  date: string
  /** Duración del catálogo. La HORA de inicio no existe en el modelo. */
  durationHours: number | null
  people: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCountry: string | null
  unitPriceCents: number
  discountCents: number
  totalCents: number
  currency: string
  status: string
  /** 'wompi' | 'paypal' | 'mock' | null si no llegó a crearse el pago. */
  paymentProvider: string | null
  paymentStatus: PaymentStatusFilter
  paymentEnvironment: string | null
  paymentReference: string | null
  isTest: boolean
  /** true si la reserva está asociada a una cuenta; false si fue sin registro. */
  hasAccount: boolean
  createdAt: Date
  paidAt: Date | null
}

export type SalidaRow = {
  key: string
  experienceId: string
  titulo: string
  destino: string
  fecha: string
  durationHours: number | null
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
  reservas: ReservaRow[]
  proximas: SalidaRow[]
  historicas: SalidaRow[]
  salidas: SalidaRow[]
  comparativa: ExperienceComparison[]
  tasaCancelacion: number | null
  hoy: string
  /** Experiencias del catálogo, para el desplegable del filtro. */
  catalogo: Array<{ id: string; titulo: string; destino: string }>
  destinos: string[]
  /** true cuando no hay ninguna reserva que cumpla el filtro. */
  vacio: boolean
  /** Reservas que existen pero quedaron fuera por el filtro de pagos reales. */
  ocultasPorFiltro: number
}

function byId(id: string): Experience | undefined {
  return experiences.find((item) => item.id === id)
}

/**
 * Cláusula WHERE de Prisma.
 *
 * El estado del PAGO no entra aquí: se resuelve en memoria, porque «sin
 * intento de pago» no es un valor de la tabla `payments` sino la ausencia
 * de filas, y mezclar las dos cosas en la consulta la hace ilegible.
 */
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
  if (filters.onlyReal) where.isTest = false

  return where
}

/**
 * El pago que representa a la reserva.
 *
 * Una reserva puede acumular varios intentos (el cliente reintenta, la
 * pasarela rechaza y vuelve a probar). El que cuenta es el aprobado; si
 * no hay ninguno, el más reciente, que es el que explica por qué la
 * reserva no avanzó.
 */
function representativePayment(
  payments: Array<{ provider: string; status: string; environment: string; reference: string; createdAt: Date }>,
) {
  return payments.find((payment) => payment.status === 'APPROVED') ?? payments[0] ?? null
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

  const rows = await prisma.booking.findMany({
    where: whereFrom(filters),
    select: {
      id: true,
      code: true,
      userId: true,
      experienceId: true,
      experienceTitle: true,
      destination: true,
      date: true,
      people: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      customerCountry: true,
      unitPriceCents: true,
      discountCents: true,
      totalCents: true,
      currency: true,
      status: true,
      isTest: true,
      createdAt: true,
      paidAt: true,
      payments: {
        select: { provider: true, status: true, environment: true, reference: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })

  const todas: ReservaRow[] = rows.map((row) => {
    const payment = representativePayment(row.payments)
    const catalogo = byId(row.experienceId)

    return {
      id: row.id,
      code: row.code,
      experienceId: row.experienceId,
      experienceTitle: row.experienceTitle,
      destination: row.destination,
      date: row.date,
      durationHours: catalogo?.durationHours ?? null,
      people: row.people,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      customerCountry: row.customerCountry,
      unitPriceCents: row.unitPriceCents,
      discountCents: row.discountCents,
      totalCents: row.totalCents,
      currency: row.currency,
      status: row.status,
      paymentProvider: payment?.provider ?? null,
      paymentStatus: (payment?.status as PaymentStatusFilter) ?? 'NONE',
      paymentEnvironment: payment?.environment ?? null,
      paymentReference: payment?.reference ?? null,
      isTest: row.isTest,
      hasAccount: row.userId !== null,
      createdAt: row.createdAt,
      paidAt: row.paidAt,
    }
  })

  const reservas = filters.paymentStatus
    ? todas.filter((reserva) => reserva.paymentStatus === filters.paymentStatus)
    : todas

  // Cuántas reservas existen pero no se están viendo por el filtro de
  // «solo cobros reales»: se dice en pantalla para que un panel vacío no
  // parezca un fallo.
  const ocultasPorFiltro = filters.onlyReal
    ? await prisma.booking.count({ where: { ...whereFrom(filters), isTest: true } })
    : 0

  /* ---------------- KPIs y agregación por salida ---------------- */

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
    ingresosRealesCents: 0,
    ingresosPruebaCents: 0,
    reservasTotales: reservas.length,
    reservasCompletadas: 0,
    reservasPendientes: 0,
    reservasCanceladas: 0,
    reservasDePrueba: 0,
  }

  for (const reserva of reservas) {
    const cobrada = (PAID_STATUSES as readonly string[]).includes(reserva.status)

    if (reserva.status === 'PENDING_PAYMENT') kpis.reservasPendientes += 1
    if (reserva.status === 'CANCELLED') kpis.reservasCanceladas += 1
    if (reserva.status === 'COMPLETED') kpis.reservasCompletadas += 1
    if (reserva.isTest) kpis.reservasDePrueba += 1

    if (cobrada) {
      kpis.personasReservadas += reserva.people
      kpis.ingresosCents += reserva.totalCents
      if (reserva.isTest) kpis.ingresosPruebaCents += reserva.totalCents
      else kpis.ingresosRealesCents += reserva.totalCents
      if (reserva.date < hoy) kpis.personasAtendidas += reserva.people
    }

    const key = `${reserva.experienceId}|${reserva.date}`
    const acc =
      salidasMap.get(key) ??
      {
        experienceId: reserva.experienceId,
        titulo: reserva.experienceTitle,
        destino: reserva.destination,
        fecha: reserva.date,
        personas: 0,
        reservas: 0,
        ingresoCents: 0,
        reservasNoCanceladas: 0,
        reservasConfirmadas: 0,
      }

    acc.reservas += 1
    if (reserva.status !== 'CANCELLED') acc.reservasNoCanceladas += 1
    if (cobrada) {
      acc.personas += reserva.people
      acc.ingresoCents += reserva.totalCents
      acc.reservasConfirmadas += 1
    }
    salidasMap.set(key, acc)
  }

  // Cupo real de cada salida implicada: una sola consulta para todas.
  const overrides = reservas.length
    ? await prisma.availability.findMany({
        where: { OR: [...salidasMap.values()].map((s) => ({ experienceId: s.experienceId, date: s.fecha })) },
        select: { experienceId: true, date: true, capacity: true, closed: true },
      })
    : []
  const overrideBy = new Map(overrides.map((o) => [`${o.experienceId}|${o.date}`, o]))

  const salidas: SalidaRow[] = [...salidasMap.values()]
    .map((acc) => {
      const catalogo = byId(acc.experienceId)
      const override = overrideBy.get(`${acc.experienceId}|${acc.fecha}`)

      const capacidad = override?.closed ? 0 : (override?.capacity ?? catalogo?.maxPeople ?? null)
      const estado = estadoDeSalida(acc, override?.closed === true, acc.fecha, hoy)

      return {
        key: `${acc.experienceId}|${acc.fecha}`,
        experienceId: acc.experienceId,
        titulo: acc.titulo,
        destino: acc.destino,
        fecha: acc.fecha,
        durationHours: catalogo?.durationHours ?? null,
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

  const comparativaMap = new Map<
    string,
    ExperienceComparison & { capacidadTotal: number; capacidadConocida: boolean }
  >()

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
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Históricas: de la más reciente hacia atrás, que es como se consultan.
  const historicas = salidas
    .filter((salida) => salida.fecha < hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  return {
    kpis,
    reservas,
    proximas,
    historicas,
    salidas,
    comparativa,
    tasaCancelacion: kpis.reservasTotales > 0 ? kpis.reservasCanceladas / kpis.reservasTotales : null,
    hoy,
    catalogo: experiences.map((item) => ({ id: item.id, titulo: item.title, destino: item.destination })),
    destinos: [...new Set(experiences.map((item) => item.destination))].sort(),
    vacio: reservas.length === 0,
    ocultasPorFiltro,
  }
}

/** Una reserva concreta, para la página de detalle. */
export async function getReserva(code: string): Promise<ReservaRow | null> {
  const row = await prisma.booking.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      userId: true,
      experienceId: true,
      experienceTitle: true,
      destination: true,
      date: true,
      people: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      customerCountry: true,
      unitPriceCents: true,
      discountCents: true,
      totalCents: true,
      currency: true,
      status: true,
      isTest: true,
      createdAt: true,
      paidAt: true,
      payments: {
        select: { provider: true, status: true, environment: true, reference: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!row) return null

  const payment = representativePayment(row.payments)
  const catalogo = byId(row.experienceId)

  return {
    id: row.id,
    code: row.code,
    experienceId: row.experienceId,
    experienceTitle: row.experienceTitle,
    destination: row.destination,
    date: row.date,
    durationHours: catalogo?.durationHours ?? null,
    people: row.people,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerCountry: row.customerCountry,
    unitPriceCents: row.unitPriceCents,
    discountCents: row.discountCents,
    totalCents: row.totalCents,
    currency: row.currency,
    status: row.status,
    paymentProvider: payment?.provider ?? null,
    paymentStatus: (payment?.status as PaymentStatusFilter) ?? 'NONE',
    paymentEnvironment: payment?.environment ?? null,
    paymentReference: payment?.reference ?? null,
    isTest: row.isTest,
    hasAccount: row.userId !== null,
    createdAt: row.createdAt,
    paidAt: row.paidAt,
  }
}

/** Todos los intentos de pago de una reserva, para el detalle. */
export async function getPagosDeReserva(bookingId: string) {
  return prisma.payment.findMany({
    where: { bookingId },
    select: {
      id: true,
      provider: true,
      environment: true,
      status: true,
      amountCents: true,
      currency: true,
      reference: true,
      providerTransactionId: true,
      failureReason: true,
      createdAt: true,
      approvedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Estado de una salida, deducido de sus reservas y de la fecha.
 *
 * No inventa una nomenclatura nueva: reutiliza la de BookingStatus
 * (pendiente / confirmada / cancelada) y añade las dos que dependen del
 * calendario: «en curso» (es hoy) y «finalizada» (ya pasó).
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
