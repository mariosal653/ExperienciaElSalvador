/**
 * Medidor semicircular de rayas, como el «Successful deals» de la
 * referencia. Las rayas hasta el porcentaje van en tinta; el resto, en
 * gris claro. `value` va de 0 a 1; `null` = no hay datos para calcularlo.
 */
export function Gauge({ value, label }: { value: number | null; label: string }) {
  const TICKS = 44
  const cx = 110
  const cy = 108
  const inner = 78
  const outer = 100
  const filled = value === null ? 0 : Math.round(value * TICKS)

  const lines = Array.from({ length: TICKS + 1 }, (_, index) => {
    // De 180° (izquierda) a 0° (derecha).
    const angle = Math.PI - (index / TICKS) * Math.PI
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x1: cx + inner * cos,
      y1: cy - inner * sin,
      x2: cx + outer * cos,
      y2: cy - outer * sin,
      on: index < filled || (filled === TICKS && index === TICKS),
    }
  })

  const pct = value === null ? '—' : `${Math.round(value * 100)}%`

  return (
    <figure className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 220 116" className="w-full" role="img" aria-label={`${label}: ${pct}`}>
        {lines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.on ? '#17181a' : '#cfcfc8'}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <figcaption className="absolute inset-x-0 bottom-1 text-center" aria-hidden="true">
        <span className="block text-3xl font-medium tracking-tight">{pct}</span>
        <span className="mt-0.5 block text-xs text-[#17181a]/60">{label}</span>
      </figcaption>
    </figure>
  )
}
