/**
 * Comparativa entre experiencias: barras horizontales, una serie.
 *
 * DECISIONES DE DISEÑO
 *
 * - Barras HORIZONTALES porque lo que se compara son nombres largos de
 *   experiencias. En vertical, las etiquetas habría que girarlas.
 *
 * - UN SOLO COLOR para todas las barras. Los tres gráficos comparan las
 *   MISMAS experiencias medidas de tres formas, así que el color no puede
 *   significar «esta métrica»: la identidad la lleva la etiqueta de cada
 *   fila. Con una sola serie tampoco hace falta leyenda; el título dice
 *   qué se está midiendo.
 *
 * - Cada barra lleva su valor escrito al lado. El eje se omite a
 *   propósito: con pocas filas, el número exacto informa más que una
 *   escala que hay que leer por aproximación.
 *
 * - Se ordena de mayor a menor: es lo que hace comparable un ranking.
 *
 * - Está hecho con HTML y CSS, no con SVG ni con una librería de
 *   gráficos. Refluye solo en móvil, el texto es texto de verdad (se
 *   puede seleccionar y lo lee un lector de pantalla) y no añade ninguna
 *   dependencia al proyecto.
 *
 * Los datos SIEMPRE salen de las reservas reales. Si no hay ninguna, se
 * muestra el estado vacío en lugar de un gráfico con ceros.
 */

export type BarDatum = {
  id: string
  label: string
  value: number
  /** Texto ya formateado del valor (dinero, personas…). */
  display: string
}

export function BarComparison({
  title,
  description,
  data,
  emptyLabel = 'Sin datos para este filtro.',
}: {
  title: string
  description?: string
  data: BarDatum[]
  emptyLabel?: string
}) {
  const rows = [...data].sort((a, b) => b.value - a.value)
  const max = rows.reduce((top, row) => Math.max(top, row.value), 0)
  const hayDatos = rows.length > 0 && max > 0

  return (
    <figure className="min-w-0 rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(26,65,69,.06)] sm:p-5">
      <figcaption>
        <h3 className="text-sm font-bold text-[#173f45]">{title}</h3>
        {description && <p className="mt-1 text-xs text-[#6a8588]">{description}</p>}
      </figcaption>

      {!hayDatos ? (
        <p className="mt-6 rounded-xl bg-[#f4f7f5] px-4 py-6 text-center text-sm text-[#6a8588]">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {rows.map((row) => {
            // `max` es > 0 aquí, así que no hay división por cero. El 2 %
            // mínimo evita que un valor pequeño quede invisible.
            const pct = Math.max(2, Math.round((row.value / max) * 100))
            return (
              <li key={row.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-medium text-[#173f45]" title={row.label}>
                    {row.label}
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-[#173f45]">{row.display}</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#eef2f0]">
                  <div
                    className="h-full rounded-full bg-[#b8481c]"
                    style={{ width: `${pct}%` }}
                    role="img"
                    aria-label={`${row.label}: ${row.display}`}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </figure>
  )
}
