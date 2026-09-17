# 0053 — Catálogo UBIGEO nacional aplicado a producción

## Contexto

El catálogo completo de distritos del Perú (`infraestructura/datos-semilla/0002_catalogo-ubigeo-nacional.sql`)
ya existía en el repositorio desde antes — generado el 2 de septiembre a partir de una fuente
real (MIT, INEI/RENIEC/CEPLAN/MINSA/PNUD-Perú, ver
[`fuentes-externas/ubigeo-peru-aumentado/README.md`](../../infraestructura/datos-semilla/fuentes-externas/ubigeo-peru-aumentado/README.md)),
pero **nunca se había aplicado a la base de producción** en Supabase — solo estaba el piloto
(4 distritos de Lima). El propio `README.md` de `datos-semilla` seguía diciendo, de forma
desactualizada, que este catálogo "no cargaba".

## Qué se hizo

1. Se aplicó `0002_catalogo-ubigeo-nacional.sql` a la base de producción en Supabase.
   Confirmado antes/después: `distritos` pasó de 4 a **1892**, `provincias` de 1 a **196**,
   `departamentos` de 1 a **25**. El piloto (San Borja, Miraflores, Surco, Surquillo) quedó
   intacto — el script usa `ON CONFLICT DO NOTHING`.
2. Se corrigió `infraestructura/datos-semilla/README.md`, que decía lo contrario de lo que
   ahora es cierto.
3. Se confirmó que el panel admin (`apps/admin/src/paginas/Distritos.tsx`, botón "＋ Expandir
   a un distrito nuevo") y el endpoint `GET /distritos/buscar` **ya estaban construidos para
   este escenario exacto** — solo esperaban a que el catálogo tuviera datos. No hizo falta
   tocar código de la app ni de la API.

## Verificado en vivo

Consulta directa a la base de producción: "Barranco" (150104) y "La Molina" (150114) existen,
con `activo = false` — listos para activarse desde el panel con un clic, sin ninguna migración
ni carga de datos adicional.

## Qué falta para expandir a un distrito nuevo de verdad

Activar el distrito en el panel es el primer paso, pero **no alcanza solo** — un distrito
activo sin comunidades ni negocios no le sirve a nadie. Falta, por cada distrito nuevo:

1. Activarlo desde el panel (✅ ya funciona, hoy mismo).
2. Crear al menos una comunidad dentro de ese distrito (el panel ya lo permite inline, en la
   misma pantalla).
3. Cargar negocios reales de esa zona — hoy esto es trabajo manual desde el panel, negocio por
   negocio (no hay una fuente de datos externa equivalente al catálogo UBIGEO para esto).
4. Asignar una cuenta de junta vecinal / validador de contenido a ese distrito, si se quiere
   contenido moderado desde el día uno.

Es decir: el catálogo geográfico ya no es un bloqueante técnico, pero cargar negocios reales de
un distrito nuevo sigue siendo trabajo manual — no hay atajo de datos para eso, a diferencia del
UBIGEO.
