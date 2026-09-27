'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Experiencias guardadas (♥).
 *
 * Sin cuenta viven en el navegador (localStorage). Con sesión iniciada se
 * guardan en la cuenta: al entrar, lo guardado en el navegador se sube y
 * la lista queda igual en cualquier dispositivo.
 *
 * Si el almacenamiento está bloqueado o la red falla, la interfaz sigue
 * funcionando con lo que tenga en memoria.
 */
const STORAGE_KEY = 'ees:favorites'
const EVENT = 'ees:favorites-changed'

function readLocal(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {}
  // Otros componentes de la misma página (tarjetas, detalle) se enteran.
  window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }))
}

export function useFavorites() {
  const { status } = useSession()
  const signedIn = status === 'authenticated'
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(readLocal())
    const onChange = (event: Event) => setIds((event as CustomEvent<string[]>).detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  // Al iniciar sesión: sube lo local y adopta la lista de la cuenta.
  useEffect(() => {
    if (!signedIn) return
    let active = true
    fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merge: readLocal() }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { ids?: string[] } | null) => {
        if (active && payload?.ids) writeLocal(payload.ids)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [signedIn])

  const toggle = useCallback(
    async (id: string): Promise<void> => {
      const current = readLocal()
      const saved = !current.includes(id)
      const next = saved ? [...current, id] : current.filter((item) => item !== id)
      writeLocal(next)
      if (signedIn) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experienceId: id, saved }),
        }).catch(() => {})
      }
    },
    [signedIn],
  )

  return { ids, toggle, signedIn }
}
