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
    teal: 'bg-surface-mint text-brand',
    terracota: 'bg-accent-soft text-accent',
    ambar: 'bg-gold-pale text-gold-ink',
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-faint">{label}</p>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${accents[accent]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-brand">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}
