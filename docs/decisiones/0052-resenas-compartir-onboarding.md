# 0052 — Reseñas, compartir y onboarding

## Contexto

Primer tramo del plan de "Negocio/crecimiento" y "Producto/experiencia de usuario"
propuesto: de todo lo discutido, se construyeron las tres piezas que no dependían de una
decisión de negocio (precio de publicidad) ni de datos externos (catálogo UBIGEO) —
ver el resto del plan más abajo, en "Qué queda pendiente y por qué".

## 1. Reseñas y calificaciones

Módulo nuevo de punta a punta, siguiendo el mismo patrón que `avisos` (moderación) y
`negocios` (propiedad del contenido):

- **Esquema**: `infraestructura/migraciones/0015_resenas.sql` — tabla `resenas`, un vecino
  una reseña por negocio (`UNIQUE(negocio_id, usuario_id)`), baja lógica no aplica (el
  vecino borra la suya directo) y ocultamiento por moderación (`oculta`,
  `ocultada_por_cuenta_id`) para spam o lenguaje ofensivo, igual criterio que avisos.
  **Ya aplicada a la base de producción en Supabase** (no solo el archivo SQL local).
- **API**: `apps/api/src/modulos/resenas/` — lectura pública (`GET /resenas`,
  `GET /resenas/resumen`), "mi reseña" y crear/editar/borrar detrás de
  `JwtVecinoAuthGuard` (upsert vía `ON CONFLICT`, nunca duplica), y ocultar/mostrar
  detrás de `validador_contenido`/`super_admin`.
- **App**: `ResenasNegocio.tsx` en la ficha de negocio — promedio + estrellas, lista de
  reseñas, formulario para dejar/editar la propia (solo si hay sesión de vecino real, no
  en modo invitado), botón eliminar. Distingue "sin reseñas todavía" de "no se pudo
  cargar" — antes de este ajuste ambos casos se veían idénticos.

## 2. Compartir negocio

`Share.share()` nativo de React Native — mismo patrón ya usado en avisos
(`TarjetaAviso.tsx`), sin librería nueva. Botón junto al nombre del negocio en la ficha.

## 3. Onboarding (3 pasos, primer login)

`Onboarding.tsx` — carrusel de 3 pantallas (buscar, avisos, modo gestión), mostrado una
sola vez tras el primer login o al entrar en modo prueba. Flag guardado en el dispositivo
(`useOnboarding.ts`, AsyncStorage vía zustand persist, mismo mecanismo que
`useSesionCuenta`).

**Bug encontrado y corregido durante la prueba en vivo**: el botón "Siguiente" dependía
de `onMomentumScrollEnd` para saber en qué paso estaba el carrusel — en web, un
`scrollTo()` programático no siempre dispara ese evento, así que el botón podía quedarse
sin avanzar nunca de la primera pantalla. Se corrigió actualizando el estado del paso
directamente al presionar el botón, sin esperar la confirmación del scroll (el evento de
scroll se dejó solo para cuando el usuario desliza manualmente).

## Qué queda pendiente y por qué

- **Publicidad self-serve** (dueño de negocio paga por destacarse): el módulo
  `PublicidadModule`/`anuncios` ya existe y funciona, pero solo para el admin. Construir
  el autoservicio requiere definir primero el modelo comercial (precio, si el cobro es
  manual vía Yape/Plin o con pasarela) — una decisión de negocio, no técnica.
- **Expansión a distritos vecinos**: bloqueada por el catálogo UBIGEO completo (1874
  distritos), que es carga de datos desde una fuente externa (INEI/RENIEC), no código.
- **Verificación de push en dispositivo real**: `NotificacionesPushService` ya estaba
  conectado a `avisos.service.ts` antes de este trabajo — no se tocó, pero nunca se probó
  en un celular real dentro de esta conversación.
