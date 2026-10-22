import { defineConfig } from 'vitest/config'

// Estas pruebas borran usuarios y reservas: necesitan una base Postgres
// EXCLUSIVA para pruebas (p. ej. una rama "test" en Neon), nunca la de
// producción. Sin TEST_DATABASE_URL se omiten.
const DB_TESTS = ['tests/payments.test.ts', 'tests/benefits.test.ts']

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: process.env.TEST_DATABASE_URL ? [] : DB_TESTS,
    // Las pruebas comparten una sola base: en paralelo se pisarian.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})
