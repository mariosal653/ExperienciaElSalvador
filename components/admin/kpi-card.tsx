import type { LucideIcon } from 'lucide-react'

/**
 * Indicador del resumen general.
 *
 * `value` llega ya formateado: quien llama sabe si son personas, dinero o
 * salidas. Aquí no se calcula nada.
 *
 * Un cero es un dato, no un hueco: se muestra igual que cualquier otro
 * número y la nota al pie explica de dónde sale.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'teal',
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  accent?: 'teal' | 'terracota' | 'ambar'
}) {
  const accents = {
    teal: 'bg-[#eaf1ed] text-[#173f45]',
    terracota: 'bg-[#fae6e0] text-[#b8481c]',
    ambar: 'bg-[#fdf2dc] text-[#8a5d0c]',
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(26,65,69,.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-[#759096]">{label}</p>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${accents[accent]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#173f45]">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-[#6a8588]">{hint}</p>}
    </div>
  )
}
