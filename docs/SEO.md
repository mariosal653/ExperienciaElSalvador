# Aparecer en Google

## El dominio oficial

El dominio de este proyecto es **`experiencesinelsalvador.com`** (con el «in»).
Es el que sirve este repositorio y el que aparece en la canónica de todas las
páginas.

Conviene tenerlo presente porque circulan nombres parecidos:

| Dominio | Qué es |
| --- | --- |
| `experiencesinelsalvador.com` | **El oficial.** Este repositorio. |
| `experienceselsalvador.com` | Otro sitio distinto, con rutas que este código no tiene (`/destinations`, `/operator/`, `/my-trips/`). No se despliega desde aquí. |
| `experienceinelsalvador.com` | No existe. Un error de tecleo habitual. |

Dos consecuencias prácticas:

1. El **Perfil de Empresa en Google** debe apuntar a `experiencesinelsalvador.com`
   en el campo *Sitio web*. Si apunta a otro dominio, el enlace entrante que
   daría el perfil —el más valioso de todos— se lo lleva ese otro sitio.
2. Si `experienceselsalvador.com` también es del proyecto, debe redirigir con
   **301** al oficial. Dos dominios con contenido parecido compiten entre sí
   por las mismas búsquedas y Google reparte la autoridad entre ambos.

Antes de dar nada por perdido: buscar el nombre del negocio en Google **no**
sirve para saber si el sitio está indexado. Para eso está `site:` (ver más
abajo).

## Los datos del negocio, idénticos en todas partes

Google reconoce un negocio comparando nombre, teléfono y web entre el Perfil
de Empresa y el sitio. Si un dato baila, los trata como dos negocios distintos
y el perfil deja de reforzar al dominio.

El correo no entra en esa comparación: **el Perfil de Empresa no tiene campo
de correo electrónico** (Google lo retiró). Vive solo en el sitio, donde sirve
de contacto público y de vía para ejercer derechos sobre los datos.

| Dato | Valor | Dónde vive en el código |
| --- | --- | --- |
| Nombre | Experiences El Salvador | `lib/contact.ts` |
| Correo | discover@experiencesinelsalvador.com | `lib/contact.ts` (solo en el sitio) |
| Teléfono | +503 7230 8067 | `lib/whatsapp.ts` |
| Web | https://experiencesinelsalvador.com | `SITE_URL` en Netlify |

El correo sale en el pie de página, en los textos legales (contacto y derechos
sobre los datos) y en los datos estructurados de la portada. **Si cambia el
nombre, el teléfono o la web, hay que cambiarlos también en el Perfil de
Empresa.**

En el perfil, el contacto equivalente es el **usuario de chat**, que debe
apuntar al mismo número: `https://wa.me/50372308067`.

### El perfil, enlazado desde el sitio

La portada declara el Perfil de Empresa en el campo `sameAs` de sus datos
estructurados, con la URL canónica por `cid`
(`https://maps.google.com/?cid=11241112588317624963`, en `lib/contact.ts`).
Esa forma es la estable: no cambia aunque se edite el nombre del negocio.

Con el perfil apuntando al sitio y el sitio declarando el perfil, la relación
queda cerrada en los dos sentidos.

Las redes sociales, cuando existan, se añaden sin tocar el repositorio con la
variable `NEXT_PUBLIC_PROFILE_URLS` en Netlify (URL separadas por comas).

### Reseñas

El ranking en Maps depende sobre todo de las reseñas, y es la única palanca
que no se toca desde el código. El enlace directo al formulario es:

```
https://g.page/r/CYMK2FJXdACcEBM/review
```

Con el servicio de conductor el momento natural de pedirla es al dejar al
cliente en su destino, mandándole ese enlace por WhatsApp el mismo día.


## Lo que ya está hecho

El sitio no tiene nada que impida indexarlo. Comprobado en producción:

- `robots.txt` permite el rastreo de todo lo público y deja fuera lo privado
  (`/admin`, `/checkout`, `/cuenta`, `/api`, entradas y reservas).
- `sitemap.xml` lista la portada, los 2 servicios de conductor, los 13
  destinos, las 14 experiencias y los legales, con URL absolutas al dominio
  real.
- Ninguna página pública lleva `noindex`, ni en la etiqueta ni en la cabecera
  `X-Robots-Tag`.
- Cada página se genera en el servidor: el HTML llega con el contenido ya
  puesto, sin esperar a JavaScript.
- Cada destino y cada experiencia tienen su propio título, descripción,
  canónica, Open Graph y datos estructurados de schema.org.

## Por qué aún no aparece

Porque Google no sabe que existe. Un dominio recién registrado, sin enlaces
entrantes desde otros sitios, no se descubre solo: el rastreador llega a una
web siguiendo enlaces desde webs que ya conoce, y a esta no apunta ninguna.

Esto no se arregla desde el código. Hay que dar de alta el sitio.

## Qué hay que hacer

### 1. Dar de alta el sitio en Google Search Console

1. Entrar en <https://search.google.com/search-console> con la cuenta de
   Google del proyecto.
2. Añadir una propiedad de tipo **Prefijo de URL** con
   `https://experiencesinelsalvador.com`.
3. Elegir el método **Etiqueta HTML**. Google da algo así:

   ```html
   <meta name="google-site-verification" content="AbC123..." />
   ```

4. Copiar **solo el valor de `content`** (`AbC123...`, sin la etiqueta).
5. En Netlify: *Site configuration → Environment variables → Add a variable*,
   con el nombre `GOOGLE_SITE_VERIFICATION` y ese valor.
6. Volver a desplegar (*Deploys → Trigger deploy → Deploy site*). El despliegue
   es lo que escribe la etiqueta en el HTML.
7. Pulsar **Verificar** en Search Console.

> La alternativa sin desplegar es verificar por **registro DNS TXT** en el
> proveedor del dominio. Sirve igual; la etiqueta es más rápida si ya se tiene
> acceso a Netlify.

### 2. Enviar el sitemap

Dentro de Search Console, en **Sitemaps**, escribir `sitemap.xml` y enviar.
Esto le entrega a Google la lista completa de páginas de una vez, en lugar de
dejar que las encuentre una por una.

### 3. Pedir la indexación de la portada

En **Inspección de URL**, pegar `https://experiencesinelsalvador.com` y pulsar
**Solicitar indexación**. Pone la portada en la cola de rastreo prioritaria.
Se puede repetir con dos o tres experiencias; no conviene hacerlo con las 30
páginas, hay cuota diaria.

### 4. Conseguir el primer enlace entrante

Es lo que más acelera el proceso y lo que más cuesta. Sirve cualquier sitio que
Google ya rastree a menudo:

- Perfil de empresa en Google (antes Google My Business), que además la hace
  aparecer en Maps. **Comprobar que el campo *Sitio web* apunta al dominio
  oficial**, no a otro parecido.
- Redes sociales del proyecto con el enlace en la biografía.
- Directorios de turismo de El Salvador.

Además, conviene declarar esos perfiles en el propio sitio. La portada escribe
un campo `sameAs` en sus datos estructurados a partir de la variable
`NEXT_PUBLIC_PROFILE_URLS` (en Netlify, URL separadas por comas):

```
NEXT_PUBLIC_PROFILE_URLS=https://maps.app.goo.gl/XXXX,https://www.instagram.com/XXXX
```

El enlace, así, queda en los dos sentidos: el perfil apunta al sitio y el sitio
apunta al perfil. Es lo que le permite a Google tratarlos como un mismo
negocio. Sin la variable, el campo simplemente no se escribe.

### 5. Bing, de paso

<https://www.bing.com/webmasters> permite importar directamente la propiedad
desde Search Console. Son cinco minutos y cubre también a DuckDuckGo, que usa
el índice de Bing.

## Cuánto tarda

Con el sitemap enviado y la indexación solicitada, la portada suele aparecer
entre **3 y 14 días**. El resto de páginas van entrando después, a su ritmo.

Para comprobarlo, buscar en Google:

```
site:experiencesinelsalvador.com
```

Mientras no devuelva nada, no está indexado. Esa búsqueda es el único indicador
fiable: no buscar el nombre del negocio y asumir lo peor, porque posicionar
para una búsqueda competida es otro problema distinto, y mucho más lento, que
el de estar indexado.

## Una nota sobre el idioma

El sitio arranca en inglés a propósito, porque el visitante que se busca es el
viajero internacional (ver `components/i18n/language-provider.tsx`). Por eso
los títulos y descripciones que verá Google están en inglés y el sitio
responderá mejor a búsquedas como *things to do in El Salvador* que a *tours en
El Salvador*.

Es una decisión de negocio, no un error. Si en algún momento interesa también
el público que busca en español, lo correcto no es traducir los metadatos
—quedarían mezclados— sino separar el sitio en rutas `/es` y `/en`, cada una
con sus propios metadatos y enlazadas entre sí con `hreflang`. Es un cambio de
cierto tamaño y conviene decidirlo antes de que Google indexe las URL actuales.
