# Inicio de sesión con redes sociales

Estado real de cada proveedor. **Ningún botón social aparece en la interfaz
mientras no existan sus credenciales**: es preferible no ofrecerlo a mostrar
un botón que lleva a un error.

---

## Google — listo, solo faltan credenciales

Código completo en `lib/auth.ts`. Se activa solo al definir las variables.

1. [Google Cloud Console](https://console.cloud.google.com/) → crear proyecto
2. *APIs y servicios → Pantalla de consentimiento OAuth* → tipo **Externo**
3. *Credenciales → Crear credenciales → ID de cliente de OAuth* → **Aplicación web**
4. URIs de redirección autorizados:
   - `http://localhost:3111/api/auth/callback/google` (desarrollo)
   - `https://TU-DOMINIO/api/auth/callback/google` (producción)

```bash
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

---

## Facebook — listo, requiere revisión de Meta

Código completo. Además de las credenciales, Meta exige que la app pase su
revisión antes de poder usarse con cuentas que no sean de prueba.

1. [Meta for Developers](https://developers.facebook.com/) → crear app tipo *Consumidor*
2. Añadir el producto **Facebook Login**
3. URI de redirección: `https://TU-DOMINIO/api/auth/callback/facebook`
4. Solicitar el permiso `email` en *App Review*

```bash
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
```

> Facebook **exige HTTPS** en los callbacks. En local no funcionará con
> `http://localhost` salvo que se use un túnel tipo ngrok.

---

## Instagram — NO se puede integrar tal cual. Hay que decidir algo antes

Dos obstáculos reales, ninguno resoluble desde el código:

1. **La API que servía para esto ya no existe.** *Instagram Basic Display API*
   se retiró el 4 de diciembre de 2024. El acceso actual pasa por
   *Instagram API with Instagram Login* o por *Facebook Login for Business*,
   pensadas para cuentas de empresa y creador, no para autenticar visitantes.

2. **Instagram no devuelve el correo electrónico.** Y el correo es la clave
   con la que este sistema identifica a un usuario y enlaza cuentas. Sin él:
   - no se puede saber si quien entra ya tenía cuenta con Google;
   - se crearían usuarios duplicados;
   - el beneficio del 25 % se podría obtener varias veces creando cuentas
     con distintos proveedores.

**Recomendación:** no ofrecer Instagram como método de acceso. Si aun así se
quiere, hay que elegir una de estas dos vías y asumir su coste:

- **A.** Pedir el correo en un paso posterior, dentro de la propia
  aplicación, y verificarlo antes de conceder cualquier beneficio.
- **B.** Usar el identificador de Instagram como identidad propia, aceptando
  que esas cuentas no se enlazan con las demás.

Ninguna se ha implementado: son decisiones de producto, no de código.

---

## TikTok — mismo problema, y más restrictivo

*TikTok Login Kit* existe, pero:

- El correo **no** forma parte de los datos que entrega por defecto; hay que
  solicitarlo y su concesión no está garantizada.
- La app necesita aprobación de TikTok antes de salir del modo de pruebas.
- Los `scopes` disponibles están orientados a leer contenido del creador, no
  a autenticar clientes.

Aplican exactamente los mismos riesgos de duplicado y de abuso del beneficio
descritos para Instagram.

**Recomendación:** dejarlo fuera del acceso. TikTok encaja mejor como fuente
de vídeos de testimonio en la sección de opiniones, que es donde ya está
previsto en `lib/reviews/index.ts`.

---

## Enlazado de cuentas

`allowDangerousEmailAccountLinking` está en **false** a propósito.

Con `true`, cualquiera que controle un proveedor que afirme tener un correo
podría entrar en la cuenta existente de ese correo. Auth.js lo llama
«dangerous» por algo.

Consecuencia práctica: si alguien se registró con correo y contraseña y luego
intenta entrar con Google usando el mismo correo, Auth.js lo rechaza. Es el
comportamiento seguro. Para permitirlo hay que implementar un enlazado
explícito: iniciar sesión primero y vincular el proveedor desde el perfil.

---

## Resumen

| Proveedor | Código | Qué falta |
|---|---|---|
| Correo y contraseña | Funcionando | Nada |
| Google | Completo | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Facebook | Completo | Credenciales + revisión de Meta + HTTPS |
| Instagram | No implementado | Decisión de producto sobre el correo |
| TikTok | No implementado | Decisión de producto sobre el correo |
