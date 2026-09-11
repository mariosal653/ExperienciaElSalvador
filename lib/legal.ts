/** Documentos legales disponibles en /legal/<slug>. */
export const LEGAL_SLUGS = ['terms', 'cancellation', 'privacy'] as const
export type LegalSlug = (typeof LEGAL_SLUGS)[number]
