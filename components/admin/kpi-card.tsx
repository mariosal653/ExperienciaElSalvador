import type { LucideIcon } from 'lucide-react'

/**
 * Indicador del resumen general.
 *
 * `value` llega ya formateado: quien llama sabe si son personas, dinero o
 * salidas. Aquí no se calcula nada.
 *
 * Un cero es un dato, no un hueco: se muestra igual que cualquier otro
 * número y la nota al pie explica de dónde sale.
 *
 * Estilo monocromo del panel; el acento solo tiñe el icono, para que
 * ingresos, pendientes y cancelaciones se distingan sin colorear la cifra.
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
    teal: 'bg-[#eeefe6] text-[#17181a]',
    terracota: 'bg-accent-soft text-accent-deep',
    ambar: 'bg-gold-pale text-gold-ink',
  }

  return (
    <div className="min-w-0 rounded-2xl border border-[#e3e3de] bg-white p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-xs text-[#17181a]/60 sm:text-sm">{label}</p>
        <span className={`hidden h-8 w-8 shrink-0 sm:grid place-items-center rounded-lg ${accents[accent]}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 break-words text-2xl font-medium tracking-tight text-[#17181a] tabular-nums sm:mt-3 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-[#17181a]/50">{hint}</p>}
    </div>
  )
}
