import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Opiniones de arranque.
 *
 * IMPORTANTE: van marcadas con `isSeed: true` y NO llevan usuario ni
 * reserva. La interfaz las etiqueta como contenido de demostración, de modo
 * que nunca se hacen pasar por opiniones verificadas de clientes reales.
 *
 * En cuanto haya opiniones reales, basta con despublicarlas:
 *   UPDATE reviews SET published = 0 WHERE isSeed = 1;
 */
const seedReviews = [
  {
    id: 'seed-gastronomia',
    authorName: 'Marcela Rivas',
    authorImage: null,
    experienceId: 'ruta-de-las-flores',
    experienceTitle: 'Ruta de las Flores',
    rating: 5,
    comment:
      'Fui por la feria gastronómica de Juayúa y terminé quedándome todo el día. El guía nos llevó a una cocina donde preparaban pupusas de chipilín como las hacía mi abuela. Comimos muchísimo y aun así el precio me pareció justo.',
    createdAt: new Date('2026-07-19T15:20:00Z'),
  },
  {
    id: 'seed-pareja-volcan',
    authorName: 'Daniel y Sofía',
    authorImage: null,
    experienceId: 'volcan-santa-ana',
    experienceTitle: 'Volcán de Santa Ana',
    rating: 5,
    comment:
      'Subimos como pareja sin ser muy deportistas y el ritmo del grupo fue perfecto. La laguna del cráter con ese verde turquesa no se parece a nada que hayamos visto. Salir a las 5 de la mañana vale cada minuto de sueño perdido.',
    createdAt: new Date('2026-08-02T18:45:00Z'),
  },
  {
    id: 'seed-familia-coatepeque',
    authorName: 'Familia Menjívar',
    authorImage: null,
    experienceId: 'kayak-coatepeque',
    experienceTitle: 'Kayak en el Lago de Coatepeque',
    rating: 4,
    comment:
      'Fuimos con dos niños de 8 y 11 años. Nos dieron chalecos para todos y el instructor tuvo mucha paciencia con los peques. Solo una cosa: llegamos casi al mediodía y pegaba bastante el sol, mejor ir temprano.',
    createdAt: new Date('2026-08-24T14:10:00Z'),
  },
  {
    id: 'seed-cultural-suchitoto',
    authorName: 'Peter Lindqvist',
    authorImage: null,
    experienceId: 'suchitoto-colonial',
    experienceTitle: 'Suchitoto colonial y lago Suchitlán',
    rating: 5,
    comment:
      'Came from Sweden with almost no Spanish and the guide switched to English without me even asking. The colonial streets, the church, the boat on the lake — a very complete day. Booking was straightforward.',
    createdAt: new Date('2026-08-30T11:05:00Z'),
  },
]

async function main() {
  for (const review of seedReviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: {},
      create: {
        ...review,
        verified: false,
        isSeed: true,
        published: true,
      },
    })
  }

  const total = await prisma.review.count()
  console.log(`Seed listo. ${seedReviews.length} opiniones de arranque. Total en base: ${total}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
