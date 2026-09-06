import { PrismaClient } from '@prisma/client'

/**
 * Cliente Prisma único.
 *
 * En desarrollo Next recarga los módulos en caliente; sin este singleton
 * cada recarga abriría una conexión nueva hasta agotar el pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
