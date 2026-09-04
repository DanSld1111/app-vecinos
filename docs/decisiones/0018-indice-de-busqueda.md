# 0018 — Índice de búsqueda de negocios (Meilisearch)

## Contexto

La búsqueda de negocios (barra de "Buscar" en `apps/movil`) usaba un `ILIKE` directo contra
Postgres sobre `n.nombre` — funciona, pero no tolera errores de tipeo ni acentos ("veterinria" o
"veterinaria" sin tilde no encontraban "Veterinaria Aviación"), no ordena por relevancia, y no
escala bien a medida que crece el directorio real de negocios. Quedó anotado como pendiente en
[10-fases-pendientes.pdf](../tecnica/10-fases-pendientes.pdf) ("Índice de búsqueda: Meilisearch o
Typesense"). El usuario eligió avanzar con esto entre los pendientes técnicos disponibles.

## Decisiones

**Meilisearch, no Typesense — por el entorno de desarrollo, no por preferencia técnica.** Sin
Docker disponible en esta máquina Windows, Typesense no tiene binario oficial más allá de
Docker/Linux; Meilisearch sí publica un `.exe` standalone para Windows. Se descargó a
`herramientas/meilisearch/` (no versionado en git — son ~128MB, `.gitignore` propio en esa
carpeta) con su propio `README.md` explicando cómo levantarlo, y una entrada nueva en
`.claude/launch.json`/`package.json` (`npm run meilisearch`) para arrancarlo igual que `admin` o
`movil`.

**El backend nunca debe romperse si Meilisearch no está corriendo.** `BusquedaService` diseñado
para "fallar en silencio hacia atrás": si `MEILI_HOST`/`MEILI_MASTER_KEY` no están configurados,
o cualquier llamada al índice lanza, se registra una advertencia (`Logger.warn`) y se devuelve
`null` — nunca una excepción que tumbe la petición real. `NegociosService.buscar()` interpreta
`null` como "usa el respaldo" y cae exactamente al mismo `ILIKE` que existía antes de este
cambio. Se pierde tolerancia a errores de tipeo mientras el índice esté caído, pero la búsqueda
en sí nunca deja de responder. Verificado en vivo apagando Meilisearch a mitad de sesión: una
búsqueda exacta siguió funcionando (vía `ILIKE`), una con error de tipeo dejó de encontrar
resultados (esperado, sin el índice) — y volvió a funcionar con tolerancia a errores apenas se
reinició Meilisearch, sin reiniciar la API.

**Meilisearch es un índice, nunca la fuente de verdad.** `NegociosService.buscar()` le pide al
índice solo *ids* en orden de relevancia; el contenido real de cada negocio se vuelve a traer de
Postgres filtrando `estado = 'activo'`. Esto importa porque el índice solo se actualiza cuando
pasa por los métodos del servicio (`crear`/`aprobar`/`rechazar`/`actualizarInfo`) — si alguna vez
se edita la base por fuera de la API (como un `DROP DATABASE` + reseed, que este proyecto hace
rutinariamente para limpiar datos de prueba), el índice puede quedar con documentos huérfanos de
negocios que ya no son públicos. Postgres como filtro final garantiza que un huérfano así **nunca
se le muestra a un usuario real** — se detectó exactamente este escenario probando en vivo
(ver más abajo) y no filtró ningún dato incorrecto, solo dejaba basura acumulándose en el índice.

**`reindexarTodo()` borra el índice completo antes de reconstruirlo** (`deleteAllDocuments()`),
en vez de solo agregar los negocios activos actuales encima de lo que ya había. Se agregó
después de encontrar el problema de arriba en vivo: sin el borrado previo, un negocio de prueba
aprobado y luego "reseteado" por fuera de la API se quedaba indexado para siempre. Con el
borrado, cada arranque de `apps/api` dejá el índice exactamente igual al estado real de Postgres.

**No se tocó el `RepositorioNegocios` (contrato) ni `useNegocios` en `apps/movil`** — la única
pieza que cambió es `RepositorioNegociosApi.listar()`: cuando `filtro.busqueda` tiene texto, llama
a `GET /negocios/buscar` (nuevo, con índice) en vez de `GET /negocios?busqueda=...` (el de
siempre). Sin texto de búsqueda, sigue exactamente igual que antes. El modo `mock` no se tocó en
absoluto — sigue con su filtro local simple, consistente con que Meilisearch es infraestructura
real, no algo que tenga sentido simular.

**Tipos de Meilisearch declarados a mano** (`apps/api/src/tipos-globales/meilisearch.d.ts`) — el
paquete `meilisearch` solo publica tipos vía `exports` en su `package.json`, sin un campo
`types`/`main` de nivel superior; con `moduleResolution: "node"` (la que ya usa todo `apps/api`),
TypeScript no los encuentra. Cambiar `moduleResolution` a `"node16"`/`"bundler"` para todo el
backend por una sola dependencia era un cambio de alcance mucho mayor — se optó por declarar a
mano únicamente la forma que este proyecto realmente usa de la librería (`search`,
`addDocuments`, `deleteDocument`, `deleteAllDocuments`, `updateSettings`).

## Validado en vivo

Contra Meilisearch y Postgres reales corriendo:
- Búsqueda exacta, sin tildes ("panaderia" → "Panadería Los Rosales") y con error de tipeo
  ("veterinria" → "Veterinaria Aviación") — las tres encontraron el negocio correcto.
- Apagar Meilisearch a mitad de sesión: la búsqueda exacta siguió funcionando (respaldo
  `ILIKE`), la de tipo con error dejó de encontrar resultados (esperado); al reiniciar
  Meilisearch, la tolerancia a errores volvió a funcionar sin reiniciar la API.
- Aprobar un negocio pendiente lo metió al índice al instante (confirmado con una búsqueda antes
  y después); un cambio sensible en la ficha de un negocio activo (que lo manda de vuelta a
  `por_verificar`) lo sacó del índice al instante.
- Encontrado y corregido en el camino: sin borrar el índice antes de reconstruirlo, un negocio de
  prueba aprobado y luego revertido por un reseed de la base quedaba indexado (aunque nunca
  visible para un usuario real, gracias al filtro de Postgres). Corregido con
  `deleteAllDocuments()` antes de reindexar.

Se limpiaron los datos de prueba recreando la base desde cero (migraciones + semilla) y
reiniciando `apps/api` para que el índice reflejara el estado limpio — confirmado: 3 negocios
activos en Postgres, 3 documentos en el índice.
