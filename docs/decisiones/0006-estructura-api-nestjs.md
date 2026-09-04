# 0006 — Estructura del backend (`apps/api`)

## Contexto

Con el esquema SQL de [0005](0005-esquema-base-de-datos.md) ya escrito, tocaba levantar el backend real que lo implementa. El doc maestro fija NestJS como framework y "un módulo por dominio" como estructura (sección 5 y 12).

## Decisiones

**Solo se implementaron los módulos con contrato ya definido: `geografia` (comunidades), `categorias` y `negocios`.** Son los únicos que `docs/tecnica/05-api-contrato.yaml` describe con el detalle suficiente para construirlos sin inventar forma de respuesta. `profesionales`, `contenido` (avisos), `usuarios` (usuarios_app) y `cuentas` (autenticación del panel) quedan pendientes — el esquema SQL de los cinco ya existe, pero construir su API antes de fijar su contrato sería adivinar una forma que después habría que romper.

**Acceso a datos: `pg` (node-postgres) directo, sin ORM.** El SQL de `infraestructura/migraciones/` ya es el contrato de la base; un ORM introduciría una segunda fuente de verdad sobre el esquema (sus propias migraciones o su propio mapeo de entidades) que competiría con el SQL versionado. Cada módulo tiene su propio archivo de mapeo fila→tipo (ej. `negocios.mapeo.ts`) que traduce `snake_case` de la base a los tipos de `paquetes/tipos`.

**`GET /negocios` y `GET /negocios/:id` filtran siempre por `estado = 'activo'`, sin excepción y sin que sea un parámetro que el cliente pueda cambiar.** Esta API la consume la app del vecino (lectura pública); un negocio `por_verificar` o `inactivo` es contenido en tránsito del panel admin y nunca debería llegar a un vecino real. Cuando el módulo `cuentas` (auth) exista, el panel admin tendrá sus propios endpoints autenticados que sí pueden ver todos los estados — no reutilizará estos.

**Paginación por keyset `(creadoEn, id)`, codificada en el cursor como base64**, nunca `OFFSET`. Cumple la regla de la sección 7.2 del doc maestro (ningún listado se devuelve completo) y evita que insertar un negocio nuevo mientras alguien pagina corra las páginas siguientes.

**`/comunidades/detectar` es una aproximación por distancia al punto "centro", no una detección real por polígono.** `Comunidad` hoy solo tiene una coordenada de referencia (ver comentario en `geografia.ts`), así que "detectar" busca la comunidad activa más cercana dentro de un radio configurable (`RADIO_DETECCION_COMUNIDAD_METROS`). Documentado como limitación conocida en el propio código — el día que exista un polígono por comunidad, la consulta cambia a `ST_Contains` y dejará de ser una aproximación.

**Sin autenticación todavía.** Los tres módulos construidos son de solo lectura pública (lo que ya expone el mock hoy). Cuando se aborde `cuentas`, ahí se decide el mecanismo (JWT + guards de NestJS es lo estándar del framework).

## Cómo correrlo

```bash
cp apps/api/.env.example apps/api/.env   # editar DATABASE_URL
# aplicar infraestructura/migraciones/*.sql a esa base (ver su README)
npm run api
```

## Qué queda para Etapa 3

Cuando exista una base con datos reales, `apps/movil/src/datos/api/` implementa las mismas interfaces (`RepositorioNegocios`, `RepositorioComunidades`, `RepositorioCategorias`) que hoy usa `mock/`, apuntando a estos tres endpoints. El cambio se activa con `EXPO_PUBLIC_DATA_SOURCE=api`, sin tocar ninguna pantalla.
