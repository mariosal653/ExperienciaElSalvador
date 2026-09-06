'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Estado de un desplegable con las tres conductas que siempre hacen falta:
 * cerrar al pulsar fuera, cerrar con Escape y devolver el foco al disparador.
 *
 * Se comparte entre el selector de destino y el calendario para que ambos
 * se comporten igual.
 */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<T | null>(null)

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const container = containerRef.current
      if (container && !container.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return { open, setOpen, close, toggle, containerRef }
}
