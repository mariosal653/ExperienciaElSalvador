import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { LanguageProvider } from '@/components/i18n/language-provider'
import { WhatsAppProvider } from '@/components/whatsapp/whatsapp-provider'
import { WhatsAppWidget } from '@/components/whatsapp/whatsapp-widget'
import './globals.css'

const SITE_NAME = 'Experience El Salvador'

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
    <html lang="en">
      <body className="antialiased">
        {/*
          El widget de WhatsApp se monta una sola vez aquí para que esté en
          todas las páginas. El provider deja que cada página publique lo
          que el visitante está mirando, y así el mensaje llega con contexto.
        */}
        <LanguageProvider>
          <WhatsAppProvider>
            {children}
            <WhatsAppWidget />
          </WhatsAppProvider>
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
