import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getService, services, vehicle } from '@/lib/services'
import { getSiteUrl } from '@/lib/site'
import { ServiceDetail } from '@/components/services/service-detail'

/**
 * Página de un servicio de transporte con conductor.
 *
 * Se genera estática en el build (una por servicio), igual que las
 * experiencias: es la página que se comparte por WhatsApp cuando alguien
 * pregunta «¿cuánto cuesta un conductor?», así que lleva sus propios
 * metadatos y datos estructurados.
 */

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.id }))
}

export const dynamicParams = false

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}

  const description = service.description.EN
  return {
    title: service.name,
    description,
    alternates: { canonical: `/servicios/${service.id}` },
    openGraph: {
      type: 'website',
      title: `${service.name} · El Salvador`,
      description,
      images: [{ url: vehicle.image.src, alt: vehicle.image.alt.EN }],
    },
    twitter: { card: 'summary_large_image', title: service.name, description },
  }
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  // Son dos servicios: el «otro» es siempre el que no es este.
  const other = services.find((item) => item.id !== service.id) ?? service
  const site = getSiteUrl()

  // Datos estructurados (schema.org). La oferta solo se marca cuando hay
  // una cifra publicada: Driver by Tour se cotiza por ruta y marcar un
  // precio inventado sería falsear el dato.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    serviceType: service.tagline.EN,
    description: service.description.EN,
    url: `${site}/servicios/${service.id}`,
    provider: { '@type': 'TravelAgency', '@id': `${site}/#organization`, name: 'Experiences El Salvador', url: site },
    areaServed: { '@type': 'Country', name: 'El Salvador' },
    ...(service.priceFromUsd === null
      ? {}
      : {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: service.priceFromUsd.toFixed(2),
              priceCurrency: 'USD',
              // HUR: hora, en el catálogo de unidades UN/CEFACT.
              unitCode: 'HUR',
            },
            url: `${site}/servicios/${service.id}`,
          },
        }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify no escapa «<»: se hace a mano para que un texto
        // nunca pueda cerrar la etiqueta <script>.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ServiceDetail service={service} other={other} />
    </>
  )
}
