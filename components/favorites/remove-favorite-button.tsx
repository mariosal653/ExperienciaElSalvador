'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'
import { useFavorites } from './use-favorites'

/** Quitar una experiencia de «Guardadas» desde la cuenta. */
export function RemoveFavoriteButton({ experienceId, name }: { experienceId: string; name: string }) {
  const { toggle } = useFavorites()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      onClick={async () => {
        setBusy(true)
        await toggle(experienceId)
        router.refresh()
      }}
      disabled={busy}
      aria-label={`Quitar ${name} de guardadas`}
      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#b8481c] shadow transition hover:scale-105 disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Heart size={17} fill="#b8481c" />}
    </button>
  )
}
