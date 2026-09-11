import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { experiences } from '@/lib/data'
import { getSiteUrl } from '@/lib/site'
import { ExperienceDetail } from '@/components/experience/experience-detail'

/**
 * Página de detalle de una experiencia.
 *
 * Se genera estática en el build (una por experiencia del catálogo): es
 * la página que se comparte y la que indexan los buscadores, así que lleva
 * sus propios metadatos, Open Graph y datos estructurados.
 */

export function generateStaticParams() {
  return experiences.map((experience) => ({ id: experience.id }))
}

export const dynamicParams = false

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const experience = experiences.find((item) => item.id === id)
  if (!experience) return {}

  const description = experience.description.EN
  return {
    title: experience.title,
    description,
    alternates: { canonical: `/experiences/${experience.id}` },
    openGraph: {
      type: 'website',
      title: `${experience.title} · ${experience.destination}`,
      description,
      images: [{ url: experience.image, alt: experience.imageAlt.EN }],
    },
    twitter: { card: 'summary_large_image', title: experience.title, description },
  }
}

export default async function ExperiencePage({ params }: Params) {
  const { id } = await params
  const experience = experiences.find((item) => item.id === id)
  if (!experience) notFound()

  const site = getSiteUrl()
  const image = experience.image.startsWith('http') ? experience.image : `${site}${experience.image}`

  // Datos estructurados (schema.org). Sin aggregateRating: las
  // valoraciones del catálogo no salen de opiniones verificadas y Google
  // penaliza marcarlas como si lo fueran.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: experience.title,
    description: experience.description.EN,
    image,
    touristType: experience.category,
    itinerary: { '@type': 'Place', name: experience.destination, address: { '@type': 'PostalAddress', addressCountry: 'SV' } },
    provider: { '@type': 'Organization', name: 'Experience El Salvador', url: site },
    offers: {
      '@type': 'Offer',
      price: experience.priceUsd.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${site}/experiences/${experience.id}`,
    },
  }

  const related = experiences
    .filter((item) => item.category === experience.category && item.id !== experience.id)
    .slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify no escapa «<»: se hace a mano para que un texto del
        // catálogo nunca pueda cerrar la etiqueta <script>.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ExperienceDetail experience={experience} related={related} />
    </>
  )
}
