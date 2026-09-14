# 0044 — Fotos subidas por el panel migradas a Supabase Storage

## Contexto

Al probar la app desplegada (Render + Netlify), varias fotos no cargaban: las tarjetas
"Disponible ahora" de Servicios, algunos negocios y sus galerías. La causa: `apps/api`
guardaba las fotos subidas desde el panel/app en disco local (`apps/api/uploads/`, ver
`foto-negocio.config.ts` y equivalentes) usando `multer.diskStorage`. Ese directorio:

1. Nunca se subió a git (está en `.gitignore` a propósito — uploads de usuario no van a git).
2. Render no tiene disco persistente en el plan free — cualquier archivo escrito en
   runtime desaparece en el siguiente redeploy, y de entrada nunca tuvo los archivos
   porque tampoco viajaron por git.

Las fotos que sí se veían (categorías, mayoría de negocios) eran URLs absolutas de Unsplash
insertadas directo por SQL (ver decisiones 0026-0032) — esas no dependían del disco y por
eso funcionaban sin cambios.

## Solución

Reemplazado el almacenamiento en disco por **Supabase Storage** (mismo proyecto que ya usa
la base de datos, bucket público `uploads`, plan free — 1GB). Nuevo servicio compartido
[`AlmacenamientoService`](../../apps/api/src/comun/almacenamiento/almacenamiento.service.ts)
(`comun/almacenamiento/`, módulo `@Global()` igual que `BaseDatosModule`) con dos métodos:

- `subir(carpeta, buffer, nombreOriginal, contentType)` → sube el archivo vía la API REST de
  Storage (`fetch`, sin librería nueva) y devuelve la URL pública completa.
- `eliminarPorUrl(url)` → borra el archivo anterior al reemplazar una foto, solo si la URL
  pertenece al bucket configurado (no falla si la URL es externa o ya no existe).

Los 6 módulos con subida de fotos (`negocios` — foto principal, productos y galería,
`categorias`, `cuentas`, `publicidad/anuncios`, `servicios-app`) cambiaron de
`multer.diskStorage` a `multer.memoryStorage()` en su `foto-*.config.ts`, y sus controllers
ahora pasan el objeto `Express.Multer.File` completo (con `.buffer`) al service en vez de
solo `archivo.filename` — el service es quien sube el buffer y guarda la URL resultante.

**Nota sobre las claves de Supabase**: la API de Storage rechaza la nueva "Secret Key"
(`sb_secret_...`) si solo se manda como `Authorization: Bearer` — también hay que mandar el
mismo valor en el header `apikey`, o falla con `"Invalid Compact JWS"` (intenta parsear el
header como JWT clásico). Ambos headers son necesarios.

## Variables de entorno nuevas

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (la Secret Key del proyecto), y
`SUPABASE_STORAGE_BUCKET` (default `uploads` si no se define). Agregadas a
`apps/api/.env` local — pendiente agregarlas también en Render para que el panel/app puedan
subir fotos nuevas ahí (sin esto, `AlmacenamientoService.subir()` lanza error explícito en
vez de fallar en silencio).

## Migración de datos existentes

Las 5 fotos que sí vivían en el disco local (4 de `servicios_app`, 1 de `cuentas`) se
subieron al bucket con un script puntual y se actualizaron las URLs en Supabase — mismo
criterio que la sincronización de datos de la decisión 0043 (solo `UPDATE`, nada destructivo).

## Validado en vivo

Probado subiendo/reemplazando fotos contra el bucket real (`curl` directo) antes de tocar el
código; luego de la migración, `https://app-vecinos.netlify.app` muestra las 4 tarjetas de
Servicios y la foto de cuenta correctamente, ya no bloqueadas por el disco efímero de Render.
