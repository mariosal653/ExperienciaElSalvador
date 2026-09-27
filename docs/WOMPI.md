# Pagos con Wompi El Salvador

Referencia oficial: <https://docs.wompi.sv> y la especificación OpenAPI
completa en <https://api.wompi.sv/index.html> (`/swagger/v1/swagger.json`).

## Contrastado con la documentación (20/09/2026, especificación OpenAPI 27/09/2026)

Cada punto donde esta aplicación habla con Wompi se verificó contra la página
oficial correspondiente. Si algún día Wompi cambia algo, estas son las páginas
que hay que volver a mirar:

| Qué | Cómo está implementado | Página oficial |
|---|---|---|
| Token | `POST https://id.wompi.sv/connect/token`, form-urlencoded con `grant_type=client_credentials`, `audience=wompi_api`, `client_id`, `client_secret` | [autenticacion](https://docs.wompi.sv/autenticacion/autenticacion.md) |
| Enlace de pago | `POST https://api.wompi.sv/EnlacePago` (`CrearEnlaceDto`); respuesta `idEnlace`, `urlEnlace`, `estaProductivo` | [enlace-de-pago](https://docs.wompi.sv/metodos-api/enlace-de-pago.md) |
| Caducidad del enlace | `vigencia.fechaInicio` / `vigencia.fechaFin` (date-time) | swagger · `EnlaceVigencia` |
| Número de reserva | `datosAdicionales: { reserva: <código> }` (mapa texto→texto; sale en reportes y webhooks) | swagger · `CrearEnlaceDto` |
| Desactivar enlace | `PUT /EnlacePago/{id}/desactivar`, sin cuerpo | swagger · `EnlacePago` |
| Datos del aplicativo | `GET /Aplicativo`; se lee `nombre` y `estaProductivo` (nunca se muestra `clientSecret`) | swagger · `AplicativoOutputDto` |
| Consulta de transacción | `GET /TransaccionCompra/{id}`; se leen `idTransaccion`, `esAprobada`, `esReal`, `monto`, `codigoAutorizacion`, `mensaje` | [obtener-transaccion-compra-por-id](https://docs.wompi.sv/metodos-api/obtener-transaccion-compra-por-id.md) |
| Firma del webhook | cabecera `wompi_hash` = HMAC-SHA256 del **cuerpo crudo** con el API Secret, en hexadecimal | [validar-webhook](https://docs.wompi.sv/webhook/validar-webhook.md) |
| Hash de la redirección | HMAC-SHA256 de `identificadorEnlaceComercio + idTransaccion + idEnlace + monto` con el API Secret | [validar-parametros-url-redirect](https://docs.wompi.sv/redirect-url/validar-parametros-url-redirect.md) |
| Cuerpo del webhook | PascalCase: `IdTransaccion`, `ResultadoTransaccion`, `Monto`, `EsProductiva`, `EnlacePago.IdentificadorEnlaceComercio` | [definicion-webhook](https://docs.wompi.sv/webhook/definicion-webhook.md) |

Las dos firmas están fijadas con pruebas en `tests/payments.test.ts`, así que un
cambio accidental en el algoritmo rompe la suite.

Un detalle que parece un error y no lo es: el campo del formulario de pago se
llama `permitirTarjetaCreditoDebido`. La errata está en la API de Wompi, no en
este proyecto; escribirlo «bien» haría que Wompi lo ignorara.

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
- El enlace se crea con `configuracion.urlRetorno` (el botón «regresar» que
  Wompi muestra antes de pedir la tarjeta) apuntando a nuestra página de
  retorno con `&cancelado=1`: así, quien se arrepiente vuelve al sitio, el
  intento queda `DECLINED` y la reserva sigue apartada para reintentar.
- `configuracion.duracionInterfazIntentoMinutos` se ata a los 30 minutos que
  se apartan las plazas. Si la pantalla de pago viviera más que el apartado,
  alguien podría pagar una plaza ya liberada.
- Además, el **enlace** caduca con `vigencia.fechaFin` a la misma hora. La
  duración de la interfaz solo limita cada pantalla: sin fecha de fin, el
  mismo enlace se podía volver a abrir y pagar después. Si la reserva es de
  «pagar después» y su plazo vence antes de 30 minutos, el enlace dura solo
  hasta el plazo.
- Al liberar una reserva «pagar después» o al vencer su plazo, los enlaces
  pendientes se desactivan en Wompi (`PUT /EnlacePago/{id}/desactivar`). Es de
  mejor esfuerzo: si Wompi no responde, la reserva se cancela igual y el enlace
  caduca solo por su `vigencia`.
- `limitesDeUso.cantidadMaximaPagosExitosos: 1` impide pagar dos veces la misma
  reserva. `cantidadMaximaPagosFallidos` se deja sin definir a propósito: un
  cliente al que le rechazan la tarjeta tiene que poder probar con otra.

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

## Comprobar las credenciales: `pnpm wompi:check`

Antes de cobrar (y cada vez que cambien las claves) ejecuta:

```bash
pnpm wompi:check
```

Lee las mismas variables que la app, obtiene un token, consulta
`GET /Aplicativo` y avisa si Wompi tiene el aplicativo en pruebas mientras
`WOMPI_ENVIRONMENT=production` (o al revés). También muestra la URL de webhook
que corresponde a `SITE_URL`. No crea enlaces ni cobros y nunca imprime claves.
Sale con código 1 si algo impide cobrar, así que sirve también en un pipeline.

## Pasar a producción — lista de verificación

1. En el panel de Wompi, saca el negocio del modo de pruebas (o pide a Wompi que
   pase el aplicativo a producción).
2. Variables en Netlify (Site configuration → Environment variables):
   `WOMPI_ENVIRONMENT=production`, `WOMPI_PUBLIC_KEY` (App ID),
   `WOMPI_PRIVATE_KEY` (API Secret) y `SITE_URL` con `https://`.
3. Ejecuta `pnpm wompi:check` con esas variables: debe terminar en
   «Listo para cobrar de verdad».
4. La base de datos de producción tiene que ser PostgreSQL (ver
   `DEPLOY_NETLIFY.md`) y con las migraciones aplicadas
   (`prisma migrate deploy`), incluida la de «pagar después».
5. Haz una compra real de importe bajo, confirma que llega el webhook
   (la reserva pasa a «confirmada» sin recargar) y reembólsala desde el panel
   de Wompi.
6. A partir de aquí se rechaza cualquier transacción con `esReal: false`, y
   las entradas de reservas de prueba no sirven para entrar.
7. Revisa los textos de `/legal/*` (plazos de cancelación y reembolso).
