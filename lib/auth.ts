import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { grantWelcomeBenefit } from './benefits'

/**
 * Autenticación con Auth.js v5 sobre el adaptador de Prisma.
 *
 * PROVEEDORES
 *  - Credenciales (correo y contraseña): funciona ya, sin configuración.
 *  - Google y Facebook: el código está completo; solo se activan si
 *    existen sus variables de entorno. Sin credenciales NO aparecen en la
 *    interfaz, para no ofrecer un botón que llevaría a un error.
 *  - Instagram y TikTok: ver docs/OAUTH.md. No se activan por decisiones
 *    de esas plataformas, no por falta de código.
 *
 * ESTRATEGIA DE SESIÓN: JWT.
 *
 * No es una preferencia: Auth.js NO admite el proveedor de credenciales con
 * sesiones en base de datos («UnsupportedStrategy: Signing in with
 * credentials only supported if JWT strategy is enabled»). Como el registro
 * con correo y contraseña es un requisito, la estrategia tiene que ser JWT.
 *
 * Consecuencia a tener en cuenta: un JWT no se puede revocar al instante;
 * la sesión vive hasta que caduca. Los usuarios y las cuentas SÍ se guardan
 * en base de datos mediante el adaptador, así que el historial, los
 * beneficios y el enlazado de cuentas funcionan igual.
 */

/** Solo se registra un proveedor si tiene credenciales reales. */
function socialProviders() {
  const providers = []

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: false,
      }),
    )
  }

  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    providers.push(
      Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET,
        allowDangerousEmailAccountLinking: false,
      }),
    )
  }

  return providers
}

/** Qué proveedores sociales están realmente disponibles. Lo usa la interfaz. */
export function enabledSocialProviders(): Array<'google' | 'facebook'> {
  const enabled: Array<'google' | 'facebook'> = []
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) enabled.push('google')
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) enabled.push('facebook')
  return enabled
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    ...socialProviders(),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const email = String(raw?.email ?? '').trim().toLowerCase()
        const password = String(raw?.password ?? '')

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })

        // Sin usuario, o cuenta creada con un proveedor social (sin
        // contraseña): se rechaza igual, sin revelar cuál de los dos es.
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],

  callbacks: {
    /**
     * Guarda el id del usuario en el token al iniciar sesión. Con estrategia
     * JWT el callback `session` ya no recibe `user`, así que el id tiene que
     * viajar aquí.
     */
    jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id
      }
      return token
    },

    /** Expone el id en la sesión: todas las consultas dependen de él. */
    session({ session, token }) {
      if (session.user && typeof token.userId === 'string') {
        session.user.id = token.userId
      }
      return session
    },
  },

  events: {
    /**
     * Se dispara SOLO cuando el adaptador crea una cuenta nueva. Es el
     * punto exacto donde nace el beneficio de bienvenida, y por eso los
     * usuarios anteriores no lo reciben.
     *
     * Cubre también el alta por Google o Facebook: si es la primera vez
     * que se crea esa cuenta, cuenta como usuario nuevo.
     */
    async createUser({ user }) {
      if (!user.id) return
      try {
        await grantWelcomeBenefit(prisma, user.id)
      } catch {
        // El @@unique(userId, code) ya impide duplicados; si salta, es que
        // el beneficio ya existía y no hay nada que hacer.
      }
    },

    async signIn({ user }) {
      if (!user.id) return
      await prisma.user
        .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        .catch(() => {})
    },
  },
})
