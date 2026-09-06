import { PrismaClient } from '@prisma/client'
import { SEED_REVIEWS } from '../lib/reviews/seed-data.ts'

const prisma = new PrismaClient()

/**
 * Carga las opiniones de arranque.
 *
 * IDEMPOTENTE: `upsert` sobre un id fijo. Ejecutarlo diez veces deja las
 * mismas cuatro filas, así que no duplica nada aunque se llame en cada
 * despliegue.
 *
 * NO toca las opiniones reales de los usuarios: solo las suyas propias,
 * identificadas por esos ids.
 *
 * Las opiniones van marcadas con `isSeed: true` y sin usuario ni reserva:
 * nunca se hacen pasar por opiniones verificadas de clientes reales.
 */
async function main() {
  for (const review of SEED_REVIEWS) {
    await prisma.review.upsert({
      where: { id: review.id },
      // Se refresca el contenido por si se corrige un texto, pero no la fecha.
      update: {
        authorName: review.authorName,
        comment: review.comment,
        rating: review.rating,
        experienceTitle: review.experienceTitle,
      },
      create: {
        id: review.id,
        authorName: review.authorName,
        authorImage: null,
        experienceId: review.experienceId,
        experienceTitle: review.experienceTitle,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.createdAt),
        verified: false,
        isSeed: true,
        published: true,
      },
    })
  }

  const seeds = await prisma.review.count({ where: { isSeed: true } })
  const real = await prisma.review.count({ where: { isSeed: false } })

  console.log(`Opiniones de arranque: ${seeds}. Opiniones reales: ${real}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
