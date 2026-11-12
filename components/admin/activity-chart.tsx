/**
 * Reservas por día de la última semana, en barras verticales.
 *
 * Dos barras por día, como en la referencia de diseño: la sólida son las
 * reservas con cobro (pagada, confirmada o completada) y la rayada las que
 * no lo tienen (pendientes o canceladas). Juntas dicen cuánto entra y
 * cuánto se queda por el camino, sin necesitar dos gráficos.
 *
 * HTML y CSS, sin librería: igual que bar-comparison.tsx.
 */

export type ActivityDay = {
  /** AAAA-MM-DD */
  date: string
  /** Etiqueta corta del día (lun, mar…). */
  label: string
  cobradas: number
  sinCobro: number
}

const HATCH =
  'repeating-linear-gradient(135deg, #b9b9b2 0 2px, transparent 2px 5px)'

export function ActivityChart({ days, title }: { days: ActivityDay[]; title: string }) {
  const max = Math.max(1, ...days.flatMap((day) => [day.cobradas, day.sinCobro]))
  // Eje con tres marcas: 0, la mitad y el máximo. El máximo se redondea a
  // par para que la marca del medio sea un número exacto.
  const top = Math.max(2, Math.ceil(max / 2) * 2)
  const ticks = [top, top / 2, 0]
  const total = days.reduce((sum, day) => sum + day.cobradas + day.sinCobro, 0)

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-[#17181a]/50">{total} en 7 días</span>
      </figcaption>

      <div className="mt-4 flex gap-3">
        <div className="flex h-32 flex-col justify-between text-[10px] tabular-nums text-[#17181a]/50" aria-hidden="true">
          {ticks.map((tick, index) => (
            <span key={index}>{tick}</span>
          ))}
        </div>
        <ul className="flex h-32 flex-1 items-end justify-between gap-2 border-b border-[#17181a]/15">
          {days.map((day) => (
            <li key={day.date} className="flex h-full flex-1 items-end justify-center gap-1">
              <span
                className="w-full max-w-[14px] rounded-t-[3px]"
                style={{ height: `${(day.sinCobro / top) * 100}%`, backgroundImage: HATCH }}
              />
              <span
                className="w-full max-w-[14px] rounded-t-[3px] bg-[#17181a]"
                style={{ height: `${(day.cobradas / top) * 100}%` }}
              />
              <span className="sr-only">
                {day.label}: {day.cobradas} con cobro, {day.sinCobro} sin cobro
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ml-6 mt-1.5 flex justify-between gap-2 pl-3" aria-hidden="true">
        {days.map((day) => (
          <span key={day.date} className="flex-1 text-center text-[11px] font-medium capitalize text-[#17181a]/70">
            {day.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-[#17181a]/60" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#17181a]" /> Con cobro
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundImage: HATCH }} /> Sin cobro
        </span>
      </div>
    </figure>
  )
}
