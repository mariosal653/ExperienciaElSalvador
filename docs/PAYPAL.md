# Pagos con PayPal

PayPal se añade como **opción adicional** a Wompi. Las dos pasarelas se
configuran por separado y conviven: el comprador elige en el checkout entre
las que estén disponibles. Si PayPal no está configurado, no aparece.

---

## 1. Obtener las credenciales

1. Entra en <https://developer.paypal.com/dashboard/> con tu cuenta de PayPal.
2. **Apps & Credentials** → pestaña **Sandbox** (pruebas) o **Live** (real).
3. **Create App** → tipo *Merchant* → dale un nombre.
4. Copia **Client ID** y **Secret**.

En Sandbox, PayPal crea además cuentas de prueba (comprador y vendedor) en
**Testing Tools → Sandbox Accounts**. Con esas se paga sin mover dinero.

---

## 2. Variables de entorno

```env
PAYPAL_ENVIRONMENT=sandbox      # sandbox | production (también vale "live")
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

Ninguna lleva el prefijo `NEXT_PUBLIC_`: las dos se quedan en el servidor. El
navegador solo llega a ver el enlace de aprobación de `paypal.com`.

También hace falta que `SITE_URL` (o la variable `URL` que pone Netlify)
apunte a la URL pública: PayPal necesita una dirección absoluta para devolver
al comprador.

Opcional, solo para pruebas contra un mock: `PAYPAL_API_URL` sustituye la
dirección de la API.

Si falta `PAYPAL_ENVIRONMENT`, o falta alguna de las dos claves, PayPal queda
desactivado. **No hay modo simulado**: un botón que dice «Pagar con PayPal» y
no cobra es peor que no tener el botón.

---

## 3. Cómo funciona

Se usa la **Orders API v2** con flujo de redirección, el mismo patrón que ya
usaba Wompi, para no duplicar la página de retorno ni la lógica de reservas.

```
  Checkout                        Servidor                      PayPal
     │  POST /api/checkout           │                             │
     ├──────────────────────────────►│                             │
     │                               │  POST /v2/checkout/orders   │
     │                               ├────────────────────────────►│
     │                               │◄────────────── orderId +    │
     │◄──── checkoutUrl ─────────────┤        enlace de aprobación │
     │                                                             │
     │  el comprador aprueba en paypal.com                         │
     ├────────────────────────────────────────────────────────────►│
     │                                                             │
     │  vuelve a /checkout/return?ref=…&provider=paypal            │
     ├──────────────────────────────►│                             │
     │                               │  POST /v2/checkout/orders/  │
     │                               │       {id}/capture          │
     │                               ├────────────────────────────►│
     │                               │◄──── captura COMPLETED ─────┤
     │                               │                             │
     │                               │  aquí, y solo aquí, la      │
     │                               │  reserva pasa a PAID        │
```

**La aprobación no es el pago.** Volver de PayPal solo significa que el
comprador pulsó el botón. El dinero se mueve en la captura, que ocurre en el
servidor (`capturePayPalPayment` en `lib/payments/process.ts`). Una reserva
nunca se marca pagada por haber llegado a la pantalla de retorno.

### Qué se valida antes de aprobar

| Comprobación | Dónde |
|---|---|
| La captura está en estado `COMPLETED` | `lib/payments/paypal.ts` |
| El importe capturado coincide con el calculado en el servidor | `approvePayment` |
| En producción no se aceptan transacciones de prueba | `approvePayment` |
| El id de la captura no se había usado ya | índice único en `payments` |

### Evitar pagos duplicados

Tres barreras independientes:

1. **`PayPal-Request-Id`** en crear y capturar: repetir la llamada devuelve el
   resultado original en lugar de cobrar otra vez.
2. **`invoice_id`** es la referencia del pago, única por cuenta de comercio.
   PayPal rechaza un segundo cobro con el mismo.
3. **Base de datos**: `Payment.providerTransactionId` es único y los cambios
   de estado son condicionales, igual que con Wompi.

### Cancelaciones y errores

- El comprador cancela en PayPal → vuelve con `?cancelado=1`, el pago queda
  `DECLINED` y la reserva sigue apartada hasta que venza: puede reintentar.
- PayPal responde que la orden no está aprobada, o la rechaza → `DECLINED`
  con el motivo guardado en `failureReason`.
- Fallo de red o error 5xx de PayPal → **no** se marca como rechazado: podría
  haberse cobrado. El pago se queda pendiente para reintentar la captura.
- Captura retenida por revisión (`PENDING`) → ni se confirma ni se rechaza.

---

## 4. Probar en sandbox

```bash
# .env
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

1. `pnpm dev`
2. Elige una experiencia y llega al checkout.
3. Selecciona **PayPal** como método de pago. Debe aparecer el aviso de modo
   de pruebas.
4. Paga con una cuenta de comprador de sandbox.
5. Al volver, la reserva debe estar confirmada y con sus entradas.

Las reservas creadas en sandbox quedan marcadas como de prueba (`isTest`), sus
entradas salen señaladas y el panel de administración las deja fuera de los
ingresos salvo que se marque «Incluir pruebas».

---

## 5. Pasar a producción

1. Repite el paso 1 en la pestaña **Live** del panel de PayPal.
2. Cambia las tres variables (`PAYPAL_ENVIRONMENT=production` más las claves
   de Live) en el proveedor de hosting, no en el repositorio.
3. Comprueba que `SITE_URL` apunta al dominio real.

A partir de ahí, cualquier transacción que PayPal marque como de prueba se
rechaza automáticamente.
