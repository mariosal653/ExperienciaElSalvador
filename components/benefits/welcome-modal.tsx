'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowRight, X, Ticket } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'

type Benefit = {
  percentage: number
  status: string
  modalDismissed: boolean
}

/**
 * Popup de bienvenida con el descuento.
 *
 * Se muestra cuando: hay sesión + beneficio AVAILABLE + no descartado.
 * El descarte se guarda EN BASE DE DATOS, no en el navegador: así no
 * reaparece al cambiar de dispositivo ni al borrar cookies.
 *
 * Cerrarlo NO consume el descuento. El beneficio sigue visible en el perfil.
 */
export function WelcomeModal() {
  const { lang } = useLanguage()
  const { status } = useSession()
  const es = lang === 'ES'
  const [benefit, setBenefit] = useState<Benefit | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Sin sesión no hay beneficio que consultar: preguntar solo devolvería
    // un 401 en la consola de cualquier visitante anónimo.
    if (status !== 'authenticated') return

    let active = true

    fetch('/api/benefits')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active || !payload?.benefit) return
        const found: Benefit = payload.benefit
        setBenefit(found)
        if (found.status === 'AVAILABLE' && !found.modalDismissed) {
          setOpen(true)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [status])

  // Cierre con Escape, como cualquier diálogo.
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function dismiss() {
    setOpen(false)
    // Persistir el descarte. No toca el estado del descuento.
    fetch('/api/benefits/dismiss-modal', { method: 'POST' }).catch(() => {})
  }

  if (!open || !benefit) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2b30]/60 p-5 motion-safe:animate-in motion-safe:fade-in"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(10,43,48,.4)] motion-safe:animate-in motion-safe:zoom-in-95">
        <button
          type="button"
          onClick={dismiss}
          aria-label={es ? 'Cerrar' : 'Close'}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#173f45] transition hover:bg-[#eaf1ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45]"
        >
          <X size={18} />
        </button>

        <div className="bg-[#173f45] px-7 py-8 text-center text-white">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f4b942] text-[#173f45]">
            <Ticket size={26} />
          </span>
          <p className="mt-4 text-5xl font-semibold tracking-tight text-[#f4c45e]">
            {benefit.percentage}% OFF
          </p>
        </div>

        <div className="px-7 py-7 text-center">
          <h2 id="welcome-title" className="text-xl font-semibold text-[#173f45]">
            {es ? '¡Bienvenido! 🎉' : 'Welcome! 🎉'}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#6a8588]">
            {es
              ? `Tienes un ${benefit.percentage}% de descuento en tu primera experiencia. Queda guardado en tu cuenta.`
              : `You have ${benefit.percentage}% off your first experience. It stays saved in your account.`}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href="/#experiencias"
              onClick={dismiss}
              className="flex items-center justify-center gap-2 rounded-full bg-[#b8481c] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18]"
            >
              {es ? 'Explorar experiencias' : 'Explore experiences'}
              <ArrowRight size={16} />
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#6a8588] transition hover:text-[#173f45]"
            >
              {es ? 'Ahora no' : 'Not now'}
            </button>
          </div>

          <p className="mt-4 text-xs text-[#8aa09c]">
            {es
              ? 'Cerrar esto no consume tu descuento.'
              : 'Closing this does not use up your discount.'}
          </p>
        </div>
      </div>
    </div>
  )
}
