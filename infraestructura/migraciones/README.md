# Migraciones

Esquema de base de datos de Etapa 2 (PostgreSQL 15+ con la extensión PostGIS). Un archivo SQL por dominio, numerado y aplicado en orden — sin herramienta de migraciones todavía: cuando `apps/api` exista, este mismo SQL se adapta al runner que se elija (Prisma, Kysely, node-pg-migrate) sin cambiar el esquema.

## Orden de aplicación

| Archivo | Contenido |
|---|---|
| `0001_extensiones.sql` | PostGIS, pg_trgm, función `set_actualizado_en()` |
| `0002_geografia.sql` | departamentos, provincias, distritos, comunidades |
| `0003_cuentas.sql` | cuentas del panel (roles internos), asignación a negocios/distritos |
| `0004_plantillas_arquetipos_categorias.sql` | plantillas visuales, arquetipos, categorías |
| `0005_negocios.sql` | negocios, categorías de negocio, productos |
| `0006_contenido.sql` | avisos, profesionales |
| `0007_usuarios_app.sql` | vecinos registrados desde la app móvil |
| `0008_publicidad_novedades.sql` | anuncios, novedades |
| `0009_pagos_preparado.sql` | andamiaje de pagos — **no usar todavía** |

Aplicar todo en una base vacía:

```bash
for f in infraestructura/migraciones/0*.sql; do psql "$DATABASE_URL" < "$f"; done
```

**Importante en Windows: usar `< "$f"` (redirección de entrada), nunca `-f "$f"`.** En `psql` de Windows, `-f` puede leer el archivo con la codepage de la consola en vez de UTF-8 y corromper silenciosamente cualquier texto con tildes o eñes (ej. "Méndez" termina guardado como "MÃ©ndez") — sin ningún error visible. Redirigir por stdin evita ese problema. Ver [decisión 0009](../../docs/decisiones/0009-validacion-en-vivo.md).

Para cargar datos de ejemplo después (San Borja/Miraflores/Surco/Surquillo, cuentas, negocios, avisos), ver [`infraestructura/datos-semilla/README.md`](../datos-semilla/README.md).

## Decisiones de diseño

Ver [`docs/decisiones/0005-esquema-base-de-datos.md`](../../docs/decisiones/0005-esquema-base-de-datos.md).

## Pendiente después de este esquema

- Script de carga del catálogo UBIGEO completo (1874 distritos, todos `activo=false` salvo el piloto) en `infraestructura/datos-semilla/`.
- Migrar los datos de ejemplo actuales (`apps/admin/src/datos/mock/*.ts`) a semillas SQL para los 4 distritos piloto (San Borja, Miraflores, Surco, Surquillo).
