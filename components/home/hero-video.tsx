'use client'

import { useEffect, useState } from 'react'
import { hasHeroVideo, heroVideo } from '@/lib/hero-video'
import type { Locale } from '@/lib/data'

/**
 * Vídeo de fondo del héroe. Se dibuja ENCIMA de la fotografía, nunca en su
 * lugar: la foto sigue siendo el LCP y el respaldo de todo lo que pueda
 * fallar (formato no soportado, red lenta, autoplay bloqueado).
 *
 * Solo se monta en el navegador y después del primer dibujado, así que no
 * compite con la foto por el ancho de banda inicial.
 *
 * No se monta cuando:
 *   - no hay vídeo configurado (ver lib/hero-video.ts);
 *   - el sistema pide menos movimiento (prefers-reduced-motion);
 *   - el navegador está en modo de ahorro de datos.
 *
 * Y si el navegador bloquea la reproducción automática —iOS en modo de
 * bajo consumo, por ejemplo—, el vídeo se retira y queda la foto.
 */
export function HeroVideo({ lang }: { lang: Locale }) {
  const [play, setPlay] = useState(false)

  useEffect(() => {
    if (!hasHeroVideo()) return

    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    } catch {
      // Navegador sin matchMedia: se asume que no hay preferencia.
    }

    // `connection` no está en todos los navegadores, de ahí la lectura suelta.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (connection?.saveData) return

    setPlay(true)
  }, [])

  if (!play) return null

  return (
    <>
      <video
        // La foto de debajo ya describe la escena; el vídeo es decoración.
        aria-label={heroVideo.description[lang]}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster={heroVideo.poster}
        // Si el navegador no deja reproducir, se retira y se ve la foto.
        onError={() => setPlay(false)}
        className="absolute inset-0 h-full w-full object-cover"
      >
        {heroVideo.sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>

      {/*
        Velo oscuro de izquierda a derecha, el mismo que el héroe declara
        bajo la fotografía. Va aquí y no en el héroe porque solo hace falta
        con vídeo: la foto de Cerro Verde ya es oscura en el lado del
        título, y el vídeo del malecón es claro y lleno de detalle. Sin él,
        «El Salvador, a tu manera» deja de leerse.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,48,.86)_0%,rgba(10,43,48,.55)_45%,rgba(10,43,48,.15)_100%)]"
      />
    </>
  )
}
