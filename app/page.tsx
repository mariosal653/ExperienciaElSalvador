import type { Metadata } from 'next'
import { HomeView } from '@/components/home/home-view'
import { experiences } from '@/lib/data'
import { getSiteUrl } from '@/lib/site'

/**
 * Inicio. Componente de SERVIDOR: aporta la URL canónica y los datos
 * estructurados; la interfaz interactiva vive en HomeView (cliente), cuyo
 * HTML también se genera en el servidor, así que el catálogo completo
 * llega a los buscadores sin esperar a JavaScript.
 */

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    images: [{ url: '/img/hero/cerro-verde-izalco-1920.jpg', width: 1920, height: 1080, alt: 'Cerro Verde and Izalco volcano, El Salvador' }],
  },
}

export default function HomePage() {
  const site = getSiteUrl()

  // Datos estructurados (schema.org): la agencia y su catálogo. Sin
  // aggregateRating: solo se marcaría con opiniones verificadas.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TravelAgency',
        '@id': `${site}/#organization`,
        name: 'Experiences El Salvador',
        url: site,
        image: `${site}/img/hero/cerro-verde-izalco-1920.jpg`,
        areaServed: { '@type': 'Country', name: 'El Salvador' },
        currenciesAccepted: 'USD',
      },
      {
        '@type': 'ItemList',
        name: 'Experiences in El Salvador',
        itemListElement: experiences.map((experience, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${site}/experiences/${experience.id}`,
          name: experience.name.EN,
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify no escapa «<»: se hace a mano para que un texto del
        // catálogo nunca pueda cerrar la etiqueta <script>.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <HomeView />
    </>
  )
}
