import { permanentRedirect } from 'next/navigation'

/**
 * Ruta antigua. Reservar ya no exige cuenta: el flujo vive en /checkout.
 * Se conserva la URL para no romper enlaces guardados o compartidos.
 */
export default async function LegacyBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  permanentRedirect(`/checkout/${encodeURIComponent(id)}`)
}
