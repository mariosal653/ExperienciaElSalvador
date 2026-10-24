'use client'

import { useLanguage } from '@/components/i18n/language-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { allCredits, LICENSE_URLS } from '@/lib/credits'

/** Créditos que exigen las licencias Creative Commons de las fotos. */
export function CreditsView() {
  const { lang } = useLanguage()
  const es = lang === 'ES'

  return (
    <div className="min-h-screen bg-cream text-brand">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-10 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{es ? 'Créditos de fotos y vídeo' : 'Photo & video credits'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {es
            ? 'Casi todo este material son fotografías y vídeos reales de El Salvador tomados de Wikimedia Commons, bajo licencias Creative Commons, que permiten su uso citando al autor. Dos archivos vienen de Pixabay: el vídeo de la portada, grabado en el Puerto de La Libertad, y una imagen de banco que no está tomada en el país y se señala como tal. Pixabay no exige citar al autor; se cita igual para saber de dónde sale cada archivo.'
            : 'Almost all of this material consists of real photographs and videos of El Salvador taken from Wikimedia Commons, under Creative Commons licenses, which allow reuse with attribution. Two files come from Pixabay: the home page video, filmed at Puerto de La Libertad, and one stock image that was not taken in the country and is labelled as such. Pixabay does not require attribution; they are credited anyway so the origin of every file is known.'}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCredits.map((credit) => (
            <li key={credit.source} className="overflow-hidden rounded-2xl bg-white shadow-card">
              {/* Los vídeos no caben en un <img>: se marcan con una ficha. */}
              {/\.(webm|mp4)$/.test(credit.file) ? (
                <div className="grid h-40 place-items-center bg-brand text-sm font-semibold text-white">{es ? 'Vídeo' : 'Video'}</div>
              ) : (
                <img src={credit.file} alt="" loading="lazy" decoding="async" className="h-40 w-full object-cover" />
              )}
              <div className="p-4 text-sm">
                <p className="font-semibold leading-snug">{credit.title}</p>
                <p className="mt-1 text-muted">
                  {es ? 'Autor' : 'Author'}: {credit.author}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <a href={LICENSE_URLS[credit.license]} target="_blank" rel="noopener noreferrer license" className="font-semibold text-accent hover:underline">
                    {credit.license}
                  </a>
                  <a href={credit.source} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                    {sourceName(credit.source)}
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  )
}

/**
 * Nombre del sitio de origen, deducido del enlace.
 *
 * Antes estaba escrito «Wikimedia Commons» a mano, y al añadir la primera
 * imagen de Pixabay la ficha mandaba a Pixabay diciendo que era Commons.
 */
function sourceName(source: string): string {
  if (source.includes('commons.wikimedia.org')) return 'Wikimedia Commons'
  if (source.includes('pixabay.com')) return 'Pixabay'
  try {
    return new URL(source).hostname.replace(/^www\./, '')
  } catch {
    return source
  }
}
