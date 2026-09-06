import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_NAME = 'Experience El Salvador'
const SITE_DESCRIPTION =
  'Encuentra experiencias locales, tours y destinos inolvidables en El Salvador.'

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Descubre El Salvador a tu manera`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Descubre El Salvador a tu manera`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Descubre El Salvador a tu manera`,
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
    <html lang="es">
      <body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body>
    </html>
  )
}
