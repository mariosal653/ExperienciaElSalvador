import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin/session'
import { parseFilters, type AdminSearchParams } from '@/lib/admin/filters'
import { getDashboard } from '@/lib/admin/metrics'
import { completeElapsedBookings } from '@/lib/admin/lifecycle'
import { buildExcel, buildPdf, nombreArchivo } from '@/lib/admin/export'

/**
 * GET /api/admin/export?formato=xlsx|pdf&<los mismos filtros del panel>
 *
 * Descarga lo que el administrador está viendo. Los parámetros son
 * IDÉNTICOS a los de /admin y pasan por el mismo `parseFilters`, así que
 * el archivo no puede contener un conjunto distinto al de la pantalla:
 * si filtró septiembre y una experiencia, eso es lo que se descarga.
 *
 * SEGURIDAD: es un endpoint de datos de clientes (nombres, correos,
 * teléfonos). Comprueba el rol contra la base en cada llamada, igual que
 * las páginas. No basta con que la ruta sea poco conocida.
 *
 * Responde 404 —y no 403— a quien no es administrador: no hay motivo para
 * confirmarle que este endpoint existe.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, code: 'notFound' }, { status: 404 })
  }

  const url = new URL(request.url)
  const formato = url.searchParams.get('formato') === 'pdf' ? 'pdf' : 'xlsx'

  const params: AdminSearchParams = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  const filters = parseFilters(params)

  try {
    // Mismo cierre de reservas vencidas que hace el panel: así el informe
    // y la pantalla cuentan lo mismo aunque se descargue directamente.
    await completeElapsedBookings()
    const data = await getDashboard(filters)

    const archivo = nombreArchivo(formato, data.hoy)
    const cuerpo = formato === 'pdf' ? await buildPdf(data, filters) : await buildExcel(data, filters)

    return new NextResponse(new Uint8Array(cuerpo), {
      headers: {
        'Content-Type':
          formato === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`,
        'Content-Length': String(cuerpo.length),
        // Datos personales: que no queden en ninguna caché intermedia.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[admin] no se pudo generar la exportación', {
      formato,
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ ok: false, code: 'exportFailed' }, { status: 500 })
  }
}
