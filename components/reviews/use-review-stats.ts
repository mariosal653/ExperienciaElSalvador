'use client'

import { useEffect, useState } from 'react'
import type { ReviewStats } from '@/lib/reviews/types'

/**
 * Valoraciones por experiencia, desde /api/reviews/stats.
 *
 * Las páginas del catálogo son estáticas; las cifras se piden en el
 * navegador para que siempre coincidan con las opiniones publicadas. Se
 * comparte una sola petición entre todos los componentes de la página.
 */
let cache: Promise<ReviewStats | null> | null = null

function loadStats(): Promise<ReviewStats | null> {
  cache ??= fetch('/api/reviews/stats')
    .then((response) => (response.ok ? (response.json() as Promise<ReviewStats>) : null))
    .catch(() => null)
    .then((stats) => {
      // Si falló, se permite reintentar en la próxima página.
      if (!stats) cache = null
      return stats
    })
  return cache
}

/** `undefined` mientras carga; `null` si no se pudo obtener. */
export function useReviewStats(): ReviewStats | null | undefined {
  const [stats, setStats] = useState<ReviewStats | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    loadStats().then((value) => {
      if (active) setStats(value)
    })
    return () => {
      active = false
    }
  }, [])

  return stats
}
