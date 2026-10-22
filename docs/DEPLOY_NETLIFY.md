# Deploy en Netlify

Netlify reconoce Next.js y aplica su adaptador oficial automáticamente.
`netlify.toml` fija el comando de build, Node 22 y la versión de pnpm.

## 1. La base de datos: PostgreSQL en Neon

Hecho el 2026-10-21. Proyecto Neon `experiences-el-salvador` (AWS US East 2,
Ohio, la región de las funciones de Netlify), base `experiences`, Postgres 17,
plan gratuito.

- `DATABASE_URL`: cadena **con pooler** (host `-pooler`). La usa la app.
- `DIRECT_URL`: cadena **sin pooler**. La usan las migraciones.

Ambas están en Netlify como secretas y en `.env.production.local` (ignorado
por git) para operar la base de producción desde la PC.

`netlify.toml` ejecuta `prisma migrate deploy` antes de cada build: un
cambio de esquema se publica con `pnpm prisma migrate dev --name <cambio>`
contra la rama de desarrollo y un push.

Las migraciones de SQLite se reemplazaron por una sola línea base de Postgres
(`20261021000000_init_postgres`); las antiguas siguen en el historial de git.
Los datos de prueba de SQLite no se migraron.

`binaryTargets` en el esquema ya incluye `rhel-openssl-3.0.x`, el sistema de
las funciones de Netlify.

## 2. Variables de entorno (Site configuration → Environment variables)

| Variable | Obligatoria | Nota |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Neon, cadena con pooler (secreta) |
| `DIRECT_URL` | Sí | Neon, cadena sin pooler (secreta) |
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
