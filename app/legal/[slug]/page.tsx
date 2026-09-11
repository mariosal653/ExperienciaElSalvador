import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalPage } from '@/components/legal/legal-page'
import { LEGAL_SLUGS, type LegalSlug } from '@/lib/legal'

/**
 * Términos, política de cancelación y privacidad, enlazados desde el
 * checkout (el cliente las acepta antes de pagar) y desde el pie.
 */

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }))
}

export const dynamicParams = false

const TITLES: Record<LegalSlug, string> = {
  terms: 'Terms and Conditions',
  cancellation: 'Cancellation Policy',
  privacy: 'Privacy Policy',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return {}
  return { title: TITLES[slug as LegalSlug], alternates: { canonical: `/legal/${slug}` } }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) notFound()
  return <LegalPage slug={slug as LegalSlug} />
}
