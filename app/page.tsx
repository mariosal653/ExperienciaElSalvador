import type { Metadata } from 'next'
import { HomeView } from '@/components/home/home-view'
import { experiences } from '@/lib/data'
import { getSiteUrl } from '@/lib/site'
import { CONTACT_EMAIL, GOOGLE_PROFILE_URL } from '@/lib/contact'
import { whatsappConfig } from '@/lib/whatsapp'

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

/**
 * Perfiles externos del negocio. Van en `sameAs` de los datos estructurados:
 * es la señal con la que Google asocia este dominio al perfil que ya existe
 * en Maps y en los resultados locales.
 *
 * El Perfil de Empresa va fijo, porque es público y no cambia. Las redes
 * sociales se añaden desde Netlify cuando existan, en una lista separada por
 * comas y sin tocar el repositorio:
 *   NEXT_PUBLIC_PROFILE_URLS=https://www.instagram.com/...,https://www.facebook.com/...
 */
const SAME_AS = [
  GOOGLE_PROFILE_URL,
  ...(process.env.NEXT_PUBLIC_PROFILE_URLS ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//.test(url)),
]

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
        logo: `${site}/icon.svg`,
        // El mismo número que el Perfil de Empresa en Google. Coincidir en
        // nombre, teléfono y web es lo que permite a Google entender que el
        // perfil y este sitio son el mismo negocio.
        telephone: whatsappConfig.phone,
        email: CONTACT_EMAIL,
        /*
          Sin calle ni número a propósito: el negocio no tiene local, solo
          área de servicio, y así está declarado también en el Perfil de
          Empresa. Se marca el país, que es cierto y verificable, en lugar
          de inventar una dirección para callar el aviso de Google.
        */
        address: { '@type': 'PostalAddress', addressCountry: 'SV' },
        areaServed: { '@type': 'Country', name: 'El Salvador' },
        currenciesAccepted: 'USD',
        /*
          Notación simbólica en vez de un rango en dólares: las experiencias
          van de 28 a 55 USD por persona, pero los servicios de conductor se
          cobran por kilómetro y por hora. Un rango concreto describiría solo
          una parte del catálogo y dejaría fuera la oferta principal.
        */
        priceRange: '$$',
        // Perfil de Empresa y redes: cada URL confirma la identidad del
        // negocio ante Google.
        sameAs: SAME_AS,
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
