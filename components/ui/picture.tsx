import type { ImgHTMLAttributes } from 'react'
import manifest from '@/lib/image-manifest.json'

const WEBP = manifest as Record<string, number[]>

/**
 * Srcset WebP de una foto local, o null si no tiene versiones generadas
 * (fotos remotas o añadidas sin correr `pnpm images`).
 */
export function webpSrcSet(src: string | null | undefined): string | null {
  if (!src) return null
  const widths = WEBP[src]
  if (!widths) return null
  const base = src.replace(/\.jpe?g$/i, '')
  return widths.map((w) => `${base}.w${w}.webp ${w}w`).join(', ')
}

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  /**
   * Ancho con que se MUESTRA la foto, como en el atributo `sizes`. Es lo
   * que permite al navegador bajar la versión de 400 px en una tarjeta en
   * lugar de la de 1 920 px. Sin él se asume pantalla completa.
   */
  sizes?: string
}

/**
 * <img> con versiones WebP por ancho cuando existen (ver
 * scripts/optimize-images.mjs). El <picture> no genera caja propia en el
 * diseño: las clases van al <img> igual que antes, así que se puede
 * cambiar un <img> por <Picture> sin tocar estilos. El JPG queda como
 * respaldo para navegadores sin WebP.
 */
export function Picture({ src, sizes = '100vw', alt = '', ...img }: Props) {
  const srcSet = webpSrcSet(src)
  const image = <img src={src} alt={alt} sizes={img.srcSet ? sizes : undefined} {...img} />
  if (!srcSet) return image
  return (
    <picture>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      {image}
    </picture>
  )
}
