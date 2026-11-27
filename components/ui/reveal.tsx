'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Aparición suave al entrar en pantalla (CSS en app/globals.css, [data-reveal]).
 *
 * El HTML del servidor llega VISIBLE: solo al montar, y solo si el bloque
 * todavía está por debajo de la pantalla, pasa a «pending» y espera al
 * scroll. Así no hay parpadeo en lo que ya se ve al cargar, nada queda
 * oculto sin JavaScript y, con «reducir movimiento», el CSS no lo anima.
 */
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'shown' | 'pending'>('shown')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    if (element.getBoundingClientRect().top < window.innerHeight) return

    setState('pending')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('shown')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} data-reveal={state} className={className}>
      {children}
    </div>
  )
}
