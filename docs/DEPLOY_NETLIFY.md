# Deploy en Netlify

Netlify reconoce Next.js y aplica su adaptador oficial automáticamente.
`netlify.toml` fija el comando de build, Node 22 y la versión de pnpm.

## 1. La base de datos: PostgreSQL (obligatorio)

**SQLite no funciona en Netlify.** Las funciones corren en un sistema de
archivos efímero y de solo lectura: `dev.db` no existe allí y, aunque
existiera, nada de lo escrito se conservaría. Es la causa del error de base
de datos en el sitio desplegado.

1. Crea una base PostgreSQL gestionada (Neon, Supabase, Netlify DB…).
   Usa la cadena **con pooler** si el proveedor la ofrece: las funciones
   abren muchas conexiones cortas.
2. En `prisma/schema.prisma`, cambia:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Las migraciones actuales son de SQLite. Genera la línea base de Postgres
   (en local, apuntando a una base Postgres de desarrollo):
   ```bash
   mv prisma/migrations prisma/migrations_sqlite
   DATABASE_URL="postgresql://…" pnpm prisma migrate dev --name init
   ```
   Confirma la carpeta nueva `prisma/migrations` en git.
4. En Netlify, cambia el comando de build para aplicar migraciones en cada
   deploy:
   ```toml
   [build]
     command = "pnpm prisma migrate deploy && pnpm run build"
   ```

`binaryTargets` en el esquema ya incluye `rhel-openssl-3.0.x`, el sistema de
las funciones de Netlify.

## 2. Variables de entorno (Site configuration → Environment variables)

| Variable | Obligatoria | Nota |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Postgres |
| `AUTH_SECRET` | Sí | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Sí | `true` |
| `SITE_URL` | Recomendada | Dominio final; si falta se usa `URL` de Netlify |
| `WOMPI_ENVIRONMENT` | Sí para cobrar | `mock` / `sandbox` / `production` — ver `docs/WOMPI.md` |
| `WOMPI_PUBLIC_KEY` / `WOMPI_PRIVATE_KEY` | Con Wompi | App ID / API Secret |
| `TICKET_VALIDATION_KEY` | Para validar entradas | Clave del personal |
| `RESEND_API_KEY` / `EMAIL_FROM` | Para enviar correos | Dominio verificado en Resend |
| `AUTH_GOOGLE_*`, `AUTH_FACEBOOK_*` | No | Botones de acceso social |

Ninguna lleva `NEXT_PUBLIC_`: todas se quedan en el servidor.

## 3. Comprobaciones tras el deploy

- `/` carga, los reels abren, el buscador filtra.
- `/experiences/volcan-santa-ana` muestra el detalle.
- Una reserva completa (con `WOMPI_ENVIRONMENT=mock` o `sandbox`) llega a
  «Booking confirmed» con entradas QR.
- Si algo falla: Netlify → Logs → Functions. Los mensajes llevan prefijos
  `[checkout]`, `[payments]`, `[webhook]`, `[email]`.
