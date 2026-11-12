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
    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17181a]'

  if (total === 0) {
    return <p className="text-xs text-[#17181a]/45">Nada que exportar con estos filtros.</p>
  }

  return (
    <div className="flex items-center gap-2" title={`${total} ${total === 1 ? 'reserva' : 'reservas'} con los filtros actuales`}>
      <a href={href('xlsx')} download className={`${base} border border-[#dcdcd6] bg-white text-[#17181a] hover:bg-[#f2f2ee]`}>
        <FileSpreadsheet size={16} aria-hidden="true" />
        Excel
      </a>
      <a href={href('pdf')} download className={`${base} bg-[#17181a] text-white hover:bg-black`}>
        <FileText size={16} aria-hidden="true" />
        Exportar PDF
      </a>
    </div>
  )
}
