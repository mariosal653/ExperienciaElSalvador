import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { destinationPages, getDestinationPage } from '@/lib/destination-details'
import { getSiteUrl } from '@/lib/site'
import { DestinationView } from '@/components/destination/destination-view'

/**
 * Página de un destino: presentación y todas sus experiencias.
 *
 * Estática (una por destino con experiencias) y con sus propios metadatos:
 * es la página que responde a búsquedas como «tours Santa Ana El Salvador».
 */

export function generateStaticParams() {
  return destinationPages().map((page) => ({ id: page.destination.id }))
}

export const dynamicParams = false

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const page = getDestinationPage(id)
  if (!page) return {}

  const name = page.destination.name
  const title = `Things to do in ${name}, El Salvador`
  const description = `${page.intro.EN} ${page.experiences.length} ${page.experiences.length === 1 ? 'experience' : 'experiences'} with local guides.`
  return {
    title,
    description,
    alternates: { canonical: `/destinos/${id}` },
    openGraph: { type: 'website', title, description, images: [{ url: page.image.src, alt: page.image.alt.EN }] },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function DestinationPage({ params }: Params) {
  const { id } = await params
  const page = getDestinationPage(id)
  if (!page) notFound()

  const site = getSiteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: page.destination.name,
    description: page.intro.EN,
    url: `${site}/destinos/${id}`,
    image: `${site}${page.image.src}`,
    containedInPlace: { '@type': 'Country', name: 'El Salvador' },
    includesAttraction: page.experiences.map((experience) => ({
      '@type': 'TouristTrip',
      name: experience.name.EN,
      url: `${site}/experiences/${experience.id}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <DestinationView destinationId={id} />
    </>
  )
}
