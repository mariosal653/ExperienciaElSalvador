import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

/** /robots.txt — deja fuera de los buscadores todo lo privado o transaccional. */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/booking/', '/checkout/', '/cuenta', '/ticket/', '/reservar/', '/login', '/register'],
    },
    sitemap: `${site}/sitemap.xml`,
  }
}
