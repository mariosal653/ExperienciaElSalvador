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
    <div className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-10 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{es ? 'Créditos de fotos y vídeo' : 'Photo & video credits'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#547176]">
          {es
            ? 'Estas imágenes de El Salvador provienen de Wikimedia Commons y se usan bajo licencias Creative Commons, que permiten su uso citando al autor. Las fotografías de Unsplash del resto del sitio se usan bajo la Licencia de Unsplash.'
            : 'These images of El Salvador come from Wikimedia Commons and are used under Creative Commons licenses, which allow reuse with attribution. Unsplash photos elsewhere on the site are used under the Unsplash License.'}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCredits.map((credit) => (
            <li key={credit.source} className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.08)]">
              {credit.file.endsWith('.webm') ? (
                <div className="grid h-40 place-items-center bg-[#173f45] text-sm font-semibold text-white">{es ? 'Vídeo' : 'Video'}</div>
              ) : (
                <img src={credit.file} alt="" loading="lazy" decoding="async" className="h-40 w-full object-cover" />
              )}
              <div className="p-4 text-sm">
                <p className="font-semibold leading-snug">{credit.title}</p>
                <p className="mt-1 text-[#547176]">
                  {es ? 'Autor' : 'Author'}: {credit.author}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <a href={LICENSE_URLS[credit.license]} target="_blank" rel="noopener noreferrer license" className="font-semibold text-[#b8481c] hover:underline">
                    {credit.license}
                  </a>
                  <a href={credit.source} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#173f45] hover:underline">
                    Wikimedia Commons
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
