# 0043 — Base de datos migrada a Supabase

## Contexto

El usuario quería poder probar la app desde su celular sin depender de que su PC estuviera
prendida con Postgres local corriendo. Primer paso: mover la base de datos a un servicio
gratuito accesible por internet. Se eligió **Supabase** (plan free, Postgres + PostGIS,
sin tarjeta de crédito) sobre la cuenta `d.ardiles011@gmail.com` (usuario Supabase
`DanSld1111`), proyecto `app-vecinos`.

## Qué se hizo

- Se aplicaron las 14 migraciones de `infraestructura/migraciones/` (en orden, tal como
  documenta su README) contra la base de Supabase, vía un script de Node con el cliente `pg`
  (no había `psql` instalado en este entorno) — mismo efecto que el `for f in ...; do psql
  "$DATABASE_URL" < "$f"; done` documentado, ejecutado programáticamente.
- Se aplicó `infraestructura/datos-semilla/0001_piloto.sql` (ya generado, no se regeneró) —
  los 4 distritos piloto, cuentas, negocios, avisos y demás datos de ejemplo.
- Se actualizó `apps/api/.env` → `DATABASE_URL` a la cadena de conexión de Supabase (no se
  sube a git, como siempre).

## Problema encontrado: conexión directa de Supabase es IPv6-only

La cadena de conexión "Direct" que ofrece Supabase (`db.<referencia>.supabase.co:5432`) solo
resuelve a una dirección IPv6 — en esta red (sin salida IPv6) eso da `ENOTFOUND`. La solución
fue usar el **connection pooler** de Supabase en su lugar (`aws-0-<region>.pooler.supabase.com:6543`),
que sí resuelve por IPv4. Si en el futuro una conexión a Supabase falla con `ENOTFOUND` o
similar, revisar primero si se está usando la URL "Direct" en vez del pooler.

## Cambio de código: SSL condicional en `BaseDatosService`

`apps/api/src/comun/base-datos/base-datos.service.ts` creaba el `Pool` de `pg` sin configurar
TLS. Postgres local no lo requiere, pero Supabase (y cualquier Postgres remoto real) sí lo
exige — sin esto, la conexión fallaba. Se agregó una detección simple: si `DATABASE_URL`
apunta a `localhost`/`127.0.0.1` no se activa `ssl`; para cualquier otro host se usa
`{ rejectUnauthorized: false }`. Esto mantiene el desarrollo local sin cambios y funciona con
Supabase, Railway, Render Postgres o cualquier otro host remoto sin tener que volver a tocar
este archivo.

## Validado en vivo

Con la API apuntando a la nueva `DATABASE_URL`, arrancó sin errores y `GET /v1/comunidades`
devolvió los 4 distritos piloto reales desde Supabase (Miraflores, San Borja, etc.) — no los
datos del Postgres local anterior.

## Qué sigue

Esto resuelve solo la base de datos. Para que la app sea usable desde el celular sin depender
de la PC encendida, falta desplegar `apps/api` en un hosting real (ver conversación — Render
es la opción evaluada, plan free sin tarjeta) y reconectar `apps/movil` a esa URL pública.
