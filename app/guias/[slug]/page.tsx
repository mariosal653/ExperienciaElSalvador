import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGuide, guides } from '@/lib/guides'
import { GuideView } from '@/components/guides/guide-view'

/**
 * Guía de inspiración: un itinerario corto que enlaza experiencias y el
 * Personal Driver. Estática, una por guía, con sus propios metadatos.
 */

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }))
}

export const dynamicParams = false

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}

  const title = guide.title.EN
  const description = guide.summary.EN
  return {
    title,
    description,
    alternates: { canonical: `/guias/${slug}` },
    openGraph: { type: 'article', title, description, images: [{ url: guide.image.src, alt: guide.image.alt.EN }] },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params
  if (!getGuide(slug)) notFound()
  return <GuideView slug={slug} />
}
