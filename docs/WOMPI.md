# Pagos con Wompi El Salvador

Referencia oficial: <https://docs.wompi.sv>

## Cómo está montado

```
Checkout (sin cuenta)
  └─ POST /api/checkout ─ valida en servidor, calcula el precio desde el catálogo
       ├─ crea Booking  PENDING_PAYMENT (plazas apartadas 30 min)
       ├─ crea Payment  PENDING
       └─ crea un Enlace de Pago en Wompi → el cliente paga en la página de Wompi
                 │
   ┌─────────────┴──────────────┐
   ▼                            ▼
Webhook (servidor a servidor)   Retorno del navegador
POST /api/payments/wompi/webhook   GET /checkout/return?ref=…&idTransaccion=…
 1. firma wompi_hash (HMAC)      1. hash de la URL (solo aviso)
 2. GET /TransaccionCompra/{id}  2. GET /TransaccionCompra/{id}
        └──────────────┬─────────────┘
                       ▼
          approvePayment()  (idempotente)
          Payment APPROVED → Booking PAID → Tickets → Booking CONFIRMED → correo
```

- **Nunca** se confirma una reserva por lo que diga el navegador. La redirección
  solo dispara una consulta a la API de Wompi; manda lo que responda Wompi.
- El importe aprobado debe coincidir **exactamente** con el calculado en el
  servidor. Si no, el pago no se aprueba y queda `failureReason = amountMismatch`.
- Idempotencia: `Payment.providerTransactionId` es único; el paso a `APPROVED`
  es un update condicional; las entradas tienen `@@unique([bookingId, number])`.
  El mismo webhook diez veces = un pago y un juego de entradas.
- Los datos de tarjeta nunca pasan por esta aplicación.

## Variables de entorno

| Variable | Valor |
| --- | --- |
| `WOMPI_ENVIRONMENT` | `mock` · `sandbox` · `production` |
| `WOMPI_PUBLIC_KEY` | App ID del aplicativo (client_id) |
| `WOMPI_PRIVATE_KEY` | API Secret del aplicativo (client_secret) |
| `WOMPI_WEBHOOK_SECRET` | Opcional. Wompi firma con el API Secret; si falta se usa `WOMPI_PRIVATE_KEY` |
| `SITE_URL` | URL pública (para `urlRedirect` y `urlWebhook`) |

Los nombres de variable los pidió el proyecto; en Wompi El Salvador la
«pública» es el **App ID** y la «privada» el **API Secret**, que se usan para
obtener un token OAuth (`POST https://id.wompi.sv/connect/token`).

Sin `WOMPI_ENVIRONMENT` en producción, los pagos quedan **desactivados**:
el sitio nunca cae a `mock` en silencio.

## Modo mock (sin credenciales)

Por defecto en desarrollo. El botón de pago lleva a `/checkout/mock/<ref>`,
una pasarela simulada con «Aprobar» y «Simular rechazo». No pide datos de
tarjeta. Las reservas quedan marcadas `isTest` y sus entradas dicen «Prueba».

## Probar con Wompi en modo de pruebas (sandbox)

Wompi no tiene una URL de sandbox aparte: las pruebas se hacen con el
**negocio en modo de pruebas** desde el panel. Las transacciones de prueba
llegan con `esReal: false`.

1. Entra al panel de Wompi y deja el negocio en **modo de pruebas**.
2. En *Configuración → Integraciones* crea (o abre) el aplicativo y copia
   **App ID** y **API Secret**.
3. En `.env` (o en Netlify → Site configuration → Environment variables):
   ```
   WOMPI_ENVIRONMENT=sandbox
   WOMPI_PUBLIC_KEY=<App ID>
   WOMPI_PRIVATE_KEY=<API Secret>
   SITE_URL=https://<tu-sitio>.netlify.app
   ```
4. El webhook necesita una URL **pública**: en local, Wompi no puede llegar a
   `localhost`. Opciones: probar en un deploy de Netlify, o exponer el puerto
   con un túnel (`cloudflared tunnel --url http://localhost:3000`) y poner esa
   URL en `SITE_URL`. Aun sin webhook, la página de retorno confirma el pago
   consultando la API.
5. Reserva una experiencia y paga en la página de Wompi. Según la
   documentación de Wompi, en modo de pruebas las transacciones se aprueban
   por defecto, y un **CVV `111`** simula un rechazo (no aplica con 3DS).
6. Verás `/booking/<llave>` pasar de «Pago pendiente» a «Booking confirmed»
   con una entrada QR por viajero.

## Pasar a producción

1. Saca el negocio del modo de pruebas en el panel de Wompi.
2. `WOMPI_ENVIRONMENT=production`. A partir de aquí se rechaza cualquier
   transacción con `esReal: false`, y las entradas de reservas de prueba no
   sirven para entrar.
3. Revisa los textos de `/legal/*` (plazos de cancelación y reembolso).
