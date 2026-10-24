/**
 * Genera versiones WebP de las fotos de public/img en varios anchos y un
 * manifiesto (lib/image-manifest.json) que usa <Picture> para el srcset.
 *
 *   pnpm images
 *
 * Se ejecuta a mano al añadir o cambiar una foto, y los .webp se suben al
 * repo junto con el .jpg. No va en el build: así Netlify no gasta minutos
 * ni depende de sharp, y el sitio sigue sin optimizador de imágenes en
 * tiempo de ejecución (images.unoptimized en next.config.mjs).
 *
 * Nombre de cada versión: foto.jpg -> foto.w400.webp, foto.w800.webp…
 * (igual con .png, que se usa cuando la imagen necesita transparencia).
 * Solo se generan anchos MENORES que el original, más el original.
 */
import { createRequire } from 'node:module'
import { readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

// sharp llega como dependencia de next; se resuelve desde allí (pnpm no
// lo expone en la raíz de node_modules).
const require = createRequire(createRequire(import.meta.url).resolve('next/package.json'))
const sharp = require('sharp')

const ROOT = path.resolve(import.meta.dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const SOURCE_DIR = path.join(PUBLIC, 'img')
const MANIFEST = path.join(ROOT, 'lib', 'image-manifest.json')
const WIDTHS = [400, 800, 1280, 1920]
const QUALITY = 72

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : [full]
    }),
  )
  return files.flat()
}

async function isFresh(target, source) {
  try {
    return (await stat(target)).mtimeMs >= (await stat(source)).mtimeMs
  } catch {
    return false
  }
}

const manifest = {}
let written = 0
let before = 0
let after = 0

// También PNG: la foto del vehículo lleva fondo transparente y un JPG la
// pegaría sobre un blanco que no es el de la tarjeta. WebP conserva el
// canal alfa, así que la versión optimizada sigue recortada.
for (const file of (await walk(SOURCE_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
  const { width } = await sharp(file).metadata()
  const widths = [...WIDTHS.filter((w) => w < width), width]
  const base = file.replace(/\.(jpe?g|png)$/i, '')
  const url = '/' + path.relative(PUBLIC, file).split(path.sep).join('/')

  for (const w of widths) {
    const target = `${base}.w${w}.webp`
    if (!(await isFresh(target, file))) {
      await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(target)
      written++
    }
  }

  before += (await stat(file)).size
  after += (await stat(`${base}.w${width}.webp`)).size
  manifest[url] = widths
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `${Object.keys(manifest).length} fotos, ${written} WebP nuevos. ` +
    `A ancho completo: ${Math.round(before / 1024)} KB JPG -> ${Math.round(after / 1024)} KB WebP.`,
)
