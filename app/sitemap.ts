import type { MetadataRoute } from 'next'
import { experiences } from '@/lib/data'
import { destinationPages } from '@/lib/destination-details'
import { LEGAL_SLUGS } from '@/lib/legal'
import { services } from '@/lib/services'
import { getSiteUrl } from '@/lib/site'

/**
 * /sitemap.xml — las páginas públicas que conviene indexar. Las privadas
 * (reservas, checkout, cuenta, panel) no aparecen y además llevan noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl()
  return [
    { url: `${site}/`, changeFrequency: 'weekly', priority: 1 },
    // Los servicios de conductor van con prioridad alta: son la oferta
    // principal del sitio, por delante de destinos y experiencias.
    ...services.map((service) => ({
      url: `${site}/servicios/${service.id}`,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...destinationPages().map((page) => ({
      url: `${site}/destinos/${page.destination.id}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...experiences.map((experience) => ({
      url: `${site}/experiences/${experience.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...LEGAL_SLUGS.map((slug) => ({ url: `${site}/legal/${slug}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ]
}
