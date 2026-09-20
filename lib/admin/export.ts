import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { formatCents } from '../pricing'
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL, describeFilters, type AdminFilters, type BookingStatusFilter } from './filters'
import { PAYMENT_PROVIDER_LABEL, type AdminDashboard, type ReservaRow } from './metrics'

/**
 * Descargas del panel: Excel y PDF. SOLO SERVIDOR.
 *
 * Las dos reciben el MISMO objeto que pinta la pantalla, así que exportan
 * exactamente lo que el administrador está viendo: si filtró por un mes y
 * una experiencia, eso es lo que se descarga. No se vuelve a consultar la
 * base con otros criterios, que es como se acaban generando informes que
 * no cuadran con la pantalla.
 *
 * Los importes van en CENTAVOS en la base. Al Excel se escriben como
 * número decimal con formato de moneda —para que se puedan sumar en la
 * hoja— y al PDF ya formateados.
 */

const MARCA = 'Experiences El Salvador'

function nombreMes(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function metodo(reserva: ReservaRow): string {
  if (!reserva.paymentProvider) return 'Sin pago'
  return PAYMENT_PROVIDER_LABEL[reserva.paymentProvider] ?? reserva.paymentProvider
}

function estado(status: string): string {
  return BOOKING_STATUS_LABEL[status as BookingStatusFilter] ?? status
}

/** experiences-el-salvador-reservas-2026-09-20.xlsx */
export function nombreArchivo(extension: 'xlsx' | 'pdf', hoy: string): string {
  const base = extension === 'xlsx' ? 'reservas' : 'reporte'
  return `experiences-el-salvador-${base}-${hoy}.${extension}`
}

/* ================================================================== */
/* Excel                                                              */
/* ================================================================== */

export async function buildExcel(data: AdminDashboard, filters: AdminFilters): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = MARCA
  wb.created = new Date()

  const tituloExperiencia = filters.experienceId
    ? (data.catalogo.find((item) => item.id === filters.experienceId)?.titulo ?? null)
    : null

  /* ---- Hoja 1: reservas ---- */
  const ws = wb.addWorksheet('Reservas', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'ID', key: 'code', width: 14 },
    { header: 'Experiencia', key: 'experiencia', width: 32 },
    { header: 'Cliente', key: 'cliente', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Teléfono', key: 'telefono', width: 18 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Lugar', key: 'lugar', width: 20 },
    { header: 'Personas', key: 'personas', width: 10 },
    { header: 'Precio', key: 'precio', width: 12 },
    { header: 'Descuento', key: 'descuento', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Método de pago', key: 'metodo', width: 16 },
    { header: 'Estado del pago', key: 'estadoPago', width: 18 },
    { header: 'Estado de la reserva', key: 'estado', width: 20 },
    { header: 'Cobro real', key: 'real', width: 11 },
    { header: 'Creada', key: 'creada', width: 18 },
  ]

  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5496' } }
  header.alignment = { vertical: 'middle' }
  header.height = 20

  for (const reserva of data.reservas) {
    ws.addRow({
      code: reserva.code,
      experiencia: reserva.experienceTitle,
      cliente: reserva.customerName,
      email: reserva.customerEmail,
      telefono: reserva.customerPhone,
      fecha: reserva.date,
      lugar: reserva.destination,
      personas: reserva.people,
      precio: reserva.unitPriceCents / 100,
      descuento: reserva.discountCents / 100,
      total: reserva.totalCents / 100,
      metodo: metodo(reserva),
      estadoPago: PAYMENT_STATUS_LABEL[reserva.paymentStatus],
      estado: estado(reserva.status),
      real: reserva.isTest ? 'No (prueba)' : 'Sí',
      creada: reserva.createdAt,
    })
  }

  // Formato de moneda y fechas: así las columnas se suman en la hoja.
  for (const key of ['precio', 'descuento', 'total']) {
    ws.getColumn(key).numFmt = '"$"#,##0.00'
  }
  ws.getColumn('creada').numFmt = 'dd/mm/yyyy hh:mm'
  ws.getColumn('personas').alignment = { horizontal: 'right' }

  // Fila de totales, solo si hay algo que sumar.
  //
  // Se escribe la fórmula Y su resultado ya calculado. La fórmula deja la
  // hoja viva —si el administrador borra filas, el total se ajusta—, y el
  // resultado hace que el archivo sea correcto también en los visores que
  // no recalculan (vistas previas, importadores, Google Drive sin abrir).
  if (data.reservas.length > 0) {
    const last = ws.rowCount
    const sumaPersonas = data.reservas.reduce((total, reserva) => total + reserva.people, 0)
    const sumaImporte = data.reservas.reduce((total, reserva) => total + reserva.totalCents, 0) / 100

    const totales = ws.addRow({
      code: 'TOTAL',
      personas: { formula: `SUM(H2:H${last})`, result: sumaPersonas },
      total: { formula: `SUM(K2:K${last})`, result: sumaImporte },
    })
    totales.font = { bold: true }
  }

  ws.autoFilter = { from: 'A1', to: { row: 1, column: ws.columnCount } }

  /* ---- Hoja 2: resumen ---- */
  const resumen = wb.addWorksheet('Resumen')
  resumen.columns = [
    { header: 'Indicador', key: 'k', width: 34 },
    { header: 'Valor', key: 'v', width: 26 },
  ]
  resumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  resumen.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5496' } }

  const k = data.kpis
  const filas: Array<[string, string | number]> = [
    ['Generado', new Date().toLocaleString('es-SV')],
    ['Filtros aplicados', describeFilters(filters, tituloExperiencia)],
    ['Reservas totales', k.reservasTotales],
    ['Reservas completadas', k.reservasCompletadas],
    ['Reservas pendientes', k.reservasPendientes],
    ['Reservas canceladas', k.reservasCanceladas],
    ['Experiencias realizadas (salidas)', k.salidasRealizadas],
    ['Experiencias próximas (salidas)', k.salidasProximas],
    ['Personas atendidas', k.personasAtendidas],
    ['Personas reservadas', k.personasReservadas],
    ['Ingresos cobrados', formatCents(k.ingresosCents)],
    ['— de los cuales, cobros reales', formatCents(k.ingresosRealesCents)],
    ['— de los cuales, pagos de prueba', formatCents(k.ingresosPruebaCents)],
  ]
  for (const [etiqueta, valor] of filas) resumen.addRow({ k: etiqueta, v: valor })

  /* ---- Hoja 3: por experiencia ---- */
  const porExp = wb.addWorksheet('Por experiencia')
  porExp.columns = [
    { header: 'Experiencia', key: 'titulo', width: 34 },
    { header: 'Salidas', key: 'salidas', width: 10 },
    { header: 'Reservas', key: 'reservas', width: 10 },
    { header: 'Personas', key: 'personas', width: 10 },
    { header: 'Ingreso', key: 'ingreso', width: 14 },
    { header: 'Ocupación', key: 'ocupacion', width: 12 },
  ]
  porExp.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  porExp.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5496' } }

  for (const item of data.comparativa) {
    porExp.addRow({
      titulo: item.titulo,
      salidas: item.salidas,
      reservas: item.reservas,
      personas: item.personas,
      ingreso: item.ingresoCents / 100,
      ocupacion: item.ocupacion === null ? 'Sin dato' : item.ocupacion,
    })
  }
  porExp.getColumn('ingreso').numFmt = '"$"#,##0.00'
  porExp.getColumn('ocupacion').numFmt = '0%'

  const arrayBuffer = await wb.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

/* ================================================================== */
/* PDF                                                                */
/* ================================================================== */

const TINTA = '#173f45'
const SUAVE = '#6a8588'
const ACENTO = '#b8481c'

/**
 * Informe en PDF, apaisado para que quepan las columnas que importan.
 *
 * Se arma a mano con pdfkit en vez de renderizar HTML: no hace falta un
 * navegador en el servidor, que en funciones sin estado es un problema de
 * peso y de arranque en frío.
 */
export function buildPdf(data: AdminDashboard, filters: AdminFilters): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 36 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right
    const ancho = right - left

    const tituloExperiencia = filters.experienceId
      ? (data.catalogo.find((item) => item.id === filters.experienceId)?.titulo ?? null)
      : null

    /* ---- Cabecera ---- */
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(18).text(MARCA, left, 40)
    doc.fillColor(ACENTO).font('Helvetica-Bold').fontSize(11).text('Informe de reservas', { continued: false })
    doc
      .fillColor(SUAVE)
      .font('Helvetica')
      .fontSize(9)
      .text(`Generado el ${new Date().toLocaleString('es-SV')}`)
    doc.text(`Filtros: ${describeFilters(filters, tituloExperiencia)}`)

    doc.moveDown(0.6)
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#dce7e1').lineWidth(1).stroke()
    doc.moveDown(0.8)

    /* ---- Resumen de KPIs ---- */
    const k = data.kpis
    // Etiquetas cortas a propósito: con ocho tarjetas en una página
    // apaisada, «Experiencias realizadas» se parte en dos líneas y se come
    // el número de abajo.
    const tarjetas: Array<[string, string]> = [
      ['Reservas', String(k.reservasTotales)],
      ['Completadas', String(k.reservasCompletadas)],
      ['Pendientes', String(k.reservasPendientes)],
      ['Canceladas', String(k.reservasCanceladas)],
      ['Realizadas', String(k.salidasRealizadas)],
      ['Proximas', String(k.salidasProximas)],
      ['Personas', String(k.personasReservadas)],
      ['Ingresos', formatCents(k.ingresosCents)],
    ]

    const anchoTarjeta = ancho / tarjetas.length
    const yTarjetas = doc.y
    tarjetas.forEach(([etiqueta, valor], index) => {
      const x = left + index * anchoTarjeta
      doc.fillColor(SUAVE).font('Helvetica').fontSize(7).text(etiqueta.toUpperCase(), x, yTarjetas, {
        width: anchoTarjeta - 6,
      })
      doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(13).text(valor, x, yTarjetas + 10, {
        width: anchoTarjeta - 6,
      })
    })
    doc.y = yTarjetas + 32

    if (k.ingresosPruebaCents > 0) {
      doc
        .fillColor('#8a5d0c')
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Aviso: ${formatCents(k.ingresosPruebaCents)} de los ingresos provienen de pagos de prueba ` +
            `(pasarela simulada o sandbox). Cobros reales: ${formatCents(k.ingresosRealesCents)}.`,
          left,
          doc.y,
          { width: ancho },
        )
      doc.moveDown(0.5)
    }

    /* ---- Tabla de reservas ---- */
    //
    // Los anchos SUMAN exactamente el ancho útil de la página apaisada
    // (792 pt menos 36 de margen a cada lado = 720). Si suman de más, la
    // última columna se sale del papel y no se ve.
    const columnas: Array<{ titulo: string; ancho: number; alinear?: 'right' }> = [
      { titulo: 'Reserva', ancho: 68 },
      { titulo: 'Experiencia', ancho: 106 },
      { titulo: 'Cliente', ancho: 82 },
      { titulo: 'Email', ancho: 112 },
      { titulo: 'Fecha', ancho: 48 },
      { titulo: 'Lugar', ancho: 72 },
      { titulo: 'Pax', ancho: 24, alinear: 'right' },
      { titulo: 'Total', ancho: 48, alinear: 'right' },
      { titulo: 'Pago', ancho: 84 },
      { titulo: 'Estado', ancho: 76 },
    ]

    /**
     * Recorta un texto para que quepa en su columna.
     *
     * Hace falta porque `lineBreak: false` de pdfkit no siempre evita el
     * salto: un valor largo se partía en dos líneas y se montaba encima de
     * la fila siguiente. Midiendo y cortando, cada fila ocupa exactamente
     * una línea y la tabla queda alineada.
     */
    const recortar = (texto: string, ancho: number): string => {
      const util = ancho - 6
      if (doc.widthOfString(texto) <= util) return texto
      let corte = texto
      while (corte.length > 1 && doc.widthOfString(`${corte}…`) > util) {
        corte = corte.slice(0, -1)
      }
      return `${corte.trimEnd()}…`
    }

    const dibujarCabecera = () => {
      const y = doc.y
      doc.rect(left, y - 2, ancho, 16).fill('#2e5496')
      let x = left
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
      for (const columna of columnas) {
        doc.text(columna.titulo.toUpperCase(), x + 3, y + 2.5, {
          width: columna.ancho - 6,
          align: columna.alinear ?? 'left',
          lineBreak: false,
        })
        x += columna.ancho
      }
      doc.y = y + 18
    }

    doc.moveDown(0.3)
    dibujarCabecera()

    doc.font('Helvetica').fontSize(7.5)
    let alterna = false

    for (const reserva of data.reservas) {
      // Salto de página con la cabecera repetida: una tabla cortada sin
      // encabezados en la página 3 no se puede leer.
      if (doc.y > doc.page.height - doc.page.margins.bottom - 24) {
        doc.addPage()
        doc.y = doc.page.margins.top
        dibujarCabecera()
        doc.font('Helvetica').fontSize(7.5)
      }

      const y = doc.y
      if (alterna) doc.rect(left, y - 2, ancho, 14).fill('#f5f8f6')
      alterna = !alterna

      const celdas = [
        reserva.code + (reserva.isTest ? ' *' : ''),
        reserva.experienceTitle,
        reserva.customerName,
        reserva.customerEmail,
        nombreMes(reserva.date),
        reserva.destination,
        String(reserva.people),
        formatCents(reserva.totalCents, reserva.currency),
        `${metodo(reserva)} · ${PAYMENT_STATUS_LABEL[reserva.paymentStatus]}`,
        estado(reserva.status),
      ]

      let x = left
      doc.fillColor(TINTA)
      celdas.forEach((texto, index) => {
        doc.text(recortar(texto, columnas[index].ancho), x + 3, y + 1.5, {
          width: columnas[index].ancho - 6,
          align: columnas[index].alinear ?? 'left',
          lineBreak: false,
        })
        x += columnas[index].ancho
      })
      doc.y = y + 14
    }

    if (data.reservas.length === 0) {
      doc.fillColor(SUAVE).font('Helvetica').fontSize(9).text('No hay reservas que cumplan estos filtros.', left, doc.y + 6)
    } else {
      /* ---- Totales ---- */
      doc.moveDown(0.4)
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#dce7e1').lineWidth(1).stroke()
      doc.moveDown(0.4)
      doc
        .fillColor(TINTA)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
          `TOTALES — ${data.reservas.length} reservas · ${k.personasReservadas} personas con cobro aprobado · ` +
            `${formatCents(k.ingresosCents)} cobrados`,
          left,
          doc.y,
          { width: ancho },
        )
      if (data.kpis.reservasDePrueba > 0) {
        doc
          .fillColor(SUAVE)
          .font('Helvetica')
          .fontSize(7.5)
          .text('* Reserva creada con una pasarela de prueba: su importe no es un ingreso real.', left, doc.y + 2)
      }
    }

    doc.end()
  })
}
