import { FileSpreadsheet, FileText } from 'lucide-react'
import { toSearchParams, type AdminFilters } from '@/lib/admin/filters'

/**
 * Descargas del panel.
 *
 * Son enlaces normales, no botones con JavaScript: el navegador descarga
 * el archivo con la cabecera Content-Disposition que manda el servidor.
 * Sin estado, sin bundle de cliente y funciona igual si se abre en una
 * pestaña nueva.
 *
 * Los enlaces llevan los filtros ACTUALES, que es lo que hace que la
 * descarga contenga lo mismo que la pantalla.
 */
export function ExportButtons({ filters, total }: { filters: AdminFilters; total: number }) {
  const params = toSearchParams(filters)

  const href = (formato: 'xlsx' | 'pdf') => {
    const query = new URLSearchParams(params)
    query.set('formato', formato)
    return `/api/admin/export?${query.toString()}`
  }

  const base =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8481c]'

  if (total === 0) {
    return (
      <p className="text-xs text-[#9ab0ad]">No hay nada que exportar con estos filtros.</p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={href('xlsx')}
        download
        className={`${base} border-[#a4cdbc] bg-white text-[#256b54] hover:bg-[#e3f0e9]`}
      >
        <FileSpreadsheet size={16} />
        Excel
      </a>
      <a
        href={href('pdf')}
        download
        className={`${base} border-[#e3b5a7] bg-white text-[#b8481c] hover:bg-[#fae6e0]`}
      >
        <FileText size={16} />
        PDF
      </a>
      <span className="text-xs text-[#6a8588]">
        {total} {total === 1 ? 'reserva' : 'reservas'} con los filtros actuales
      </span>
    </div>
  )
}
