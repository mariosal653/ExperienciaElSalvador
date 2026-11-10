import type { ReactNode } from 'react'
import { SharedName, SharedPhoto } from '@/components/ui/shared-transition'

/**
 * Foto y nombre de un destino que vuelan de su tarjeta al héroe de
 * /destinos/[id]. Detalles en components/ui/shared-transition.tsx.
 */
type Props = { id: string; enabled?: boolean; children: ReactNode }

export function DestinationPhoto({ id, ...props }: Props & { className?: string }) {
  return <SharedPhoto name={`destino-foto-${id}`} {...props} />
}

export function DestinationName({ id, ...props }: Props) {
  return <SharedName name={`destino-nombre-${id}`} {...props} />
}
