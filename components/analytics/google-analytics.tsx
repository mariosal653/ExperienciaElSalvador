'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { GA_ID, safePath, track } from '@/lib/analytics'

/**
 * Carga GA4 solo si existe NEXT_PUBLIC_GA_ID (se define en Netlify). Sin
 * la variable no se pide nada a Google: local y previews quedan limpios.
 * Envía una vista por cada cambio de ruta (ver ensureGtag).
 */
export function GoogleAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    track('page_view', { page_path: safePath(pathname), page_title: document.title })
  }, [pathname])

  if (!GA_ID) return null

  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
}
