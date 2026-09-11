import type { Metadata } from 'next'
import { CreditsView } from '@/components/legal/credits-view'

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Authors and licenses of the photos and videos used on Experience El Salvador.',
  alternates: { canonical: '/credits' },
}

export default function CreditsPage() {
  return <CreditsView />
}
