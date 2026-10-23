import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { LanguageProvider } from '@/components/i18n/language-provider'
import { SessionBoundary } from '@/components/auth/session-boundary'
import { WhatsAppProvider } from '@/components/whatsapp/whatsapp-provider'
import { WhatsAppWidget } from '@/components/whatsapp/whatsapp-widget'
import { getSiteUrl } from '@/lib/site'
import './globals.css'

const SITE_NAME = 'Experiences El Salvador'

/**
 * Las dos fuentes del sitio, autoalojadas por next/font: no hay petición a
 * Google en el navegador y no hay salto de maquetación al cargar.
 *
 * Jakarta lleva toda la interfaz. Fraunces solo aparece en los acentos en
 * cursiva de los titulares («a tu manera», «dejan huella»), de ahí que se
 * cargue únicamente en cursiva: es media fuente menos que descargar.
 *
 * `latin-ext` es obligatorio: sin él, las tildes y la ñ del español se
 * quedan sin dibujar y el navegador las saca de otra fuente.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-jakarta',
})

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  style: 'italic',
  display: 'swap',
  variable: '--font-fraunces',
  // Fraunces es suave de serie; `SOFT` y `WONK` le dan el aire editorial.
  axes: ['SOFT', 'WONK', 'opsz'],
})

/**
 * Los metadatos van en INGLÉS porque es el idioma por defecto del sitio y
 * el de `<html lang="en">`. Son estáticos: se generan en el servidor y no
 * pueden reaccionar al selector de idioma, que es estado del cliente.
 * Cuando existan rutas /es y /en, cada una traerá los suyos.
 */
const SITE_TAGLINE = 'Discover El Salvador your way'
const SITE_DESCRIPTION =
  'Find local experiences, tours and unforgettable destinations across El Salvador.'

export const metadata: Metadata = {
  // Base para las URL absolutas de Open Graph (imágenes de cada experiencia).
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['es_SV'],
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  /*
    Verificación de Google Search Console por etiqueta <meta>.

    Search Console es lo único que hace que Google se entere de que el
    sitio existe: sin eso, un dominio nuevo y sin enlaces entrantes puede
    tardar semanas en ser descubierto, o no serlo nunca. El código de
    verificación se pega en GOOGLE_SITE_VERIFICATION, en las variables de
    entorno de Netlify, y así no hay que tocar el repositorio ni queda un
    identificador de la cuenta escrito en el código.

    Sin la variable no se escribe ninguna etiqueta.
  */
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#173f45',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // El idioma por defecto es inglés. LanguageProvider actualiza este
    // atributo cuando el visitante cambia o se recupera su preferencia.
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="antialiased">
        {/*
          El widget de WhatsApp se monta una sola vez aquí para que esté en
          todas las páginas. El provider deja que cada página publique lo
          que el visitante está mirando, y así el mensaje llega con contexto.
        */}
        <SessionBoundary>
          <LanguageProvider>
            <WhatsAppProvider>
              {children}
              <WhatsAppWidget />
            </WhatsAppProvider>
          </LanguageProvider>
        </SessionBoundary>
        {/*
          Vercel Analytics solo existe en Vercel. En Netlify su script pediría
          /_vercel/insights y fallaría en cada visita.
        */}
        {process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && <Analytics />}
        {/* GA4: solo se carga si NEXT_PUBLIC_GA_ID está definida (Netlify). */}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
