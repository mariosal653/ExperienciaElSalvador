'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { WhatsAppLead } from '@/lib/whatsapp'

/**
 * El widget vive en el layout, pero el mensaje depende de lo que el
 * visitante esté mirando, que solo sabe la página. Este contexto es el
 * puente: las páginas publican su contexto y el widget lo lee.
 *
 * Se mantiene deliberadamente mínimo — no es un gestor de estado global,
 * solo el dato que necesita el enlace de WhatsApp.
 */

type WhatsAppContextValue = {
  lead: WhatsAppLead
  setLead: (lead: WhatsAppLead) => void
}

const defaultLead: WhatsAppLead = { lang: 'ES' }

const WhatsAppContext = createContext<WhatsAppContextValue>({
  lead: defaultLead,
  setLead: () => {},
})

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [lead, setLeadState] = useState<WhatsAppLead>(defaultLead)

  // Estable, para que las páginas puedan llamarlo desde un efecto sin
  // provocar un bucle de renderizado.
  const setLead = useCallback((next: WhatsAppLead) => {
    setLeadState((current) => {
      const same =
        current.lang === next.lang &&
        (current.experience ?? null) === (next.experience ?? null) &&
        (current.destination ?? null) === (next.destination ?? null) &&
        (current.date ?? null) === (next.date ?? null) &&
        (current.people ?? null) === (next.people ?? null)

      return same ? current : next
    })
  }, [])

  const value = useMemo(() => ({ lead, setLead }), [lead, setLead])

  return <WhatsAppContext.Provider value={value}>{children}</WhatsAppContext.Provider>
}

/** Lee el contexto actual. Lo usa el widget. */
export function useWhatsAppLead(): WhatsAppContextValue {
  return useContext(WhatsAppContext)
}
