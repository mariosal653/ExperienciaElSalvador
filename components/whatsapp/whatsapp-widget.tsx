'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useWhatsAppLead } from './whatsapp-provider'
import { buildWhatsAppUrl, whatsappConfig } from '@/lib/whatsapp'

/** Glifo de WhatsApp. Se dibuja aquí porque lucide no incluye marcas. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

const BUBBLE_DISMISSED_KEY = 'wa-bubble-dismissed'

/**
 * Botón flotante de WhatsApp, visible en todo el sitio.
 *
 * Abre el enlace oficial wa.me con un mensaje que cambia según lo que el
 * visitante esté mirando. En móvil el sistema abre la aplicación; en
 * escritorio, WhatsApp Web o la app de escritorio.
 */
export function WhatsAppWidget() {
  const { lead } = useWhatsAppLead()
  const [mounted, setMounted] = useState(false)
  const [showBubble, setShowBubble] = useState(false)

  const es = lead.lang === 'ES'
  const href = buildWhatsAppUrl(lead)

  // Aparición suave, ya montado en el cliente.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // La burbuja aparece una vez por navegación y no vuelve si se cierra.
  useEffect(() => {
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(BUBBLE_DISMISSED_KEY) === '1'
    } catch {
      // Modo privado o cookies bloqueadas: se trata como no descartada.
    }
    if (dismissed) return

    const timer = setTimeout(
      () => setShowBubble(true),
      whatsappConfig.bubbleDelaySeconds * 1000,
    )
    return () => clearTimeout(timer)
  }, [])

  function dismissBubble() {
    setShowBubble(false)
    try {
      sessionStorage.setItem(BUBBLE_DISMISSED_KEY, '1')
    } catch {
      // Sin almacenamiento: se oculta solo durante esta sesión de página.
    }
  }

  // El safe-area va en la propia clase y no en un `style` inline: así sigue
  // habiendo variante md y no se pierde el responsive.
  // Capa 50 — ver la escala en app/globals.css.
  return (
    <div className="fixed right-6 z-50 flex flex-col items-end gap-3 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:right-8 md:bottom-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      {showBubble && (
        <div
          role="status"
          className="relative max-w-[15rem] rounded-2xl border border-[#dce7e1] bg-white px-4 py-3 pr-9 text-sm shadow-[0_12px_40px_rgba(26,65,69,.18)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
        >
          <p className="font-semibold text-[#173f45]">
            {es ? '¿Planeando tu viaje? 👋' : 'Planning your trip? 👋'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6a8588]">
            {es ? 'Podemos ayudarte por WhatsApp' : 'We can help you on WhatsApp'}
          </p>
          <button
            type="button"
            onClick={dismissBubble}
            aria-label={es ? 'Cerrar aviso' : 'Dismiss message'}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-[#759096] transition hover:bg-[#eaf1ed] hover:text-[#173f45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={es ? 'Contactar por WhatsApp' : 'Contact us on WhatsApp'}
        className={`group flex items-center gap-0 rounded-full bg-[#173f45] text-white shadow-[0_10px_30px_rgba(23,63,69,.35)] outline-none transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f4b942] motion-safe:hover:-translate-y-0.5 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        {/* Algo más pequeño en móvil, como pediste: 52 px frente a 60 px. */}
        <span className="grid size-[3.25rem] shrink-0 place-items-center rounded-full md:size-[3.75rem]">
          <WhatsAppGlyph className="h-6 w-6 md:h-7 md:w-7" />
        </span>

        {/* Etiqueta solo donde hay puntero real: en táctil basta con tocar. */}
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 [@media(hover:hover)]:block group-hover:max-w-[13rem] group-hover:pr-5 group-focus-visible:max-w-[13rem] group-focus-visible:pr-5">
          {es ? '¿Necesitas ayuda? Escríbenos' : 'Need help? Message us'}
        </span>
      </a>
    </div>
  )
}
