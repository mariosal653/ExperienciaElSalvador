import type { DefaultSession } from 'next-auth'

/**
 * Añade `id` al usuario de la sesión. Sin esto, cada consulta tendría que
 * volver a buscar al usuario por correo.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}
