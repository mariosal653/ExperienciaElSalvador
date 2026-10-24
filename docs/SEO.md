# Aparecer en Google

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
  aparecer en Maps.
- Redes sociales del proyecto con el enlace en la biografía.
- Directorios de turismo de El Salvador.

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
