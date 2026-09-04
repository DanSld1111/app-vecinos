# 0005 — Esquema de base de datos (Etapa 2)

## Contexto

Etapa 1 cerró con el contrato de datos ya fijado en `paquetes/tipos/src/`. Etapa 2 reemplaza la implementación mock por una base real sin tocar ese contrato. El esquema vive en `infraestructura/migraciones/`.

## Decisiones

**Motor: PostgreSQL + PostGIS.** Ya definido en el doc maestro (sección 5). PostGIS da el tipo `geography` y funciones de distancia nativas, necesarias para "negocios cerca de mí" y el filtrado por radio del índice de búsqueda (Etapa 2, sección 12).

**Identificadores: `TEXT`, no `UUID` ni `SERIAL`.** Los datos de ejemplo ya usan ids legibles (`com-san-borja`, `neg-cafe-malecon`). Mantenerlos como texto evita una migración de ids al pasar de mock a real y hace la base más legible en soporte manual. El backend puede seguir generándolos como slugs o como UUIDs en formato texto — el tipo de columna no lo impone.

**Enums nativos de Postgres para los campos de unión cerrada** (`RolCuenta`, `EstadoNegocio`, `CategoriaAviso`, etc.) en vez de `CHECK` o texto libre. Cada `type X = "a" | "b"` de TypeScript tiene su `CREATE TYPE ... AS ENUM` correspondiente — el compilador de TS y la base rechazan el mismo valor inválido.

**JSONB para las formas anidadas que ya están tipadas en TS** (`horarios`, `serviciosOfrecidos`, `ofertas`, campos de plantillas/arquetipos). Son datos que siempre se leen completos junto con su fila dueña, nunca se filtran por sub-campo en una consulta — no ganan nada con tablas propias, y el tipo TS ya es su esquema de validación en el borde de la API.

**Tablas puente para las relaciones muchos-a-muchos** que el contrato modela como arrays de ids (`Negocio.categoriaIds`, `Cuenta.negocioIds`, `Cuenta.distritosAsignados`): `negocio_categorias`, `cuenta_negocios`, `cuenta_distritos`. Un array de ids en TS no implica un array de Postgres cuando esos ids referencian filas reales — se pierde la integridad referencial.

**Campos que existen en la base pero no en el contrato compartido** (ej. `cuentas.password_hash`): `paquetes/tipos` describe la forma de las respuestas de la API, no el esquema interno. Un campo de credenciales nunca debe cruzar ese contrato hacia el cliente, así que es correcto que exista en la tabla y no en el tipo TS.

**`negocios.distrito_ubigeo` queda denormalizado** además de `comunidad_id`, porque el panel admin ya filtra por distrito en varias pantallas (Dashboard, ColaValidacion, Distritos) — ver `apps/admin/src/utilidades/alcance.ts`. Evita un JOIN repetido a costa de mantenerlo sincronizado si una comunidad cambiara de distrito (evento que no ocurre en el modelo de negocio actual).

**Búsqueda por texto con `pg_trgm` como interino.** El doc maestro fija Meilisearch/Typesense como índice definitivo (sección 12), pero hasta que ese servicio esté conectado, un índice GIN trigram sobre `negocios.nombre` permite `ILIKE` razonablemente rápido sin bloquear el resto de Etapa 2 a esa integración.

**Módulo de pagos: solo tabla de transacciones, sin activar.** `plan_negocio` vive en `negocios` porque es un atributo del negocio ya visible hoy en el contrato (comentario en `negocio.ts`); `pagos_transacciones` es la única tabla nueva y no se referencia desde ningún endpoint todavía — evita que "preparar el andamiaje" se convierta en construir el módulo de pagos antes de validar el modelo de ingresos (pendiente de definición, sección 14.2).

## Qué no decide este documento

Qué ORM o runner de migraciones usará `apps/api` (Prisma, Kysely, node-pg-migrate). El SQL es el contrato; la herramienta que lo aplique es un detalle de implementación de esa etapa.
