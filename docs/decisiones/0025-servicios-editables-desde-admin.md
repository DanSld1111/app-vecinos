# 0025 — Servicios editables desde el panel admin

## Contexto

Siguiendo lo pendiente de la [decisión 0024](0024-fotos-tarjetas-servicios.md): las fotos de las
4 tarjetas de "Disponible ahora" estaban fijas en el código de la app. El usuario preguntó si
podría cambiarlas desde su panel admin y confirmó explícitamente que sí lo necesita — y que,
además, cuando más adelante active alguno de los otros 8 servicios que hoy están en
"Próximamente" (Taxi, Turismo, Rescate animal, etc.), también debe poder ponerles nombre,
descripción y foto desde el panel, sin depender de un despliegue de código.

## Decisión

**Alcance: los 12 servicios, no solo los 4 activos.** Se creó una tabla `servicios_app` con una
fila por cada uno de los 12 slugs de la pantalla Servicios (los 4 activos + los 8
"próximamente"), siguiendo el mismo patrón de catálogo fijo sin paginación que ya usa la tabla
`categorias` — son pocos registros y no crecen dinámicamente.

**Qué es editable y qué queda fijo en el código**: `nombre`, `descripcion`, `estado`
(`disponible`/`proximamente`) y `foto_url` son editables desde el admin. El `slug`, el ícono de
cada tarjeta y la ruta de navegación (`RUTA_POR_SLUG` en `apps/movil/app/(tabs)/servicios/
index.tsx`) siguen fijos en el código — están atados a pantallas y assets reales de la app que
todavía no existen para los 8 servicios sin construir, así que no tendría sentido hacerlos
editables todavía.

**Comportamiento cuando se activa un servicio sin pantalla propia**: si desde el admin se marca
como "Disponible" un servicio que no está en `SLUGS_CON_PANTALLA` (hoy: negocios, restaurantes,
market-space, supermarket), la tarjeta aparece arriba con su foto igual que las demás, pero
tocarla no navega a ningún lado — todavía no hay pantalla que abrir. El panel admin avisa esto
con un mensaje explícito tanto en la lista como en el modal de edición, para que no sea una
sorpresa. Esto es intencional: el usuario puede preparar contenido (nombre, descripción, foto)
antes de que el equipo termine de construir la pantalla real.

**Backend** (`apps/api/src/modulos/servicios-app/`): `GET /servicios-app` es público (lo consume
la app móvil sin login). `PATCH /servicios-app/:slug` y `POST /servicios-app/:slug/foto` requieren
rol `super_admin`. La subida de foto reutiliza el mismo mecanismo de multer + reemplazo de archivo
anterior que ya existía para fotos de negocio (ver [decisión 0021](0021-endurecimiento-post-diagnostico.md)),
con su propio directorio `uploads/servicios/`. Cada cambio queda auditado en la tabla
`auditoria` con `entidad = "servicio_app"`.

**App móvil**: se agregó el repositorio `repositorioServicios` (mock/api, mismo patrón que el
resto del proyecto) y el hook `useServiciosApp()`. La pantalla de Servicios pasó de arrays fijos
a renderizar lo que devuelve el servidor. En modo mock se siguen usando las 4 fotos locales (no
tiene sentido depender de un servidor real solo para desarrollo offline); en modo API se resuelve
la URL relativa que devuelve el backend con `urlCompleta()` (`apps/movil/src/utilidades/
media.ts`), necesaria porque los archivos subidos se sirven fuera del prefijo `/v1` de la API. Si
un servicio no tiene foto (`fotoUrl: null`), la tarjeta cae a un fondo plano de superficie con los
mismos textos, en vez de romperse o mostrar un hueco vacío.

**Bug real encontrado y corregido de paso**: mientras se armaba `urlCompleta()`, se encontró que
`negocio.fotoPrincipalUrl` se usaba directo como `uri` de `<Image>` en 3 lugares
(`app/negocio/[id].tsx`, `TarjetaNegocio.tsx`, `TarjetaDestacadoGrande.tsx`) sin anteponer el
origen del servidor — funcionaba por casualidad en el navegador de desarrollo pero habría fallado
en un dispositivo real. Se corrigió en los 3 lugares con el mismo helper.

**Panel admin** (`apps/admin/src/paginas/Servicios.tsx`): página nueva en el nav de super-admin,
con las 12 tarjetas (foto o ícono según tenga o no, pill de estado unificada con el resto del
panel) y un modal de edición por servicio con subida de foto, nombre, descripción y selector de
estado con la advertencia mencionada arriba cuando corresponde.

## Validado en vivo

Probado el flujo completo a través de la interfaz real del panel (no solo con `curl`): se abrió
el modal de "Taxi", se confirmó que sin foto muestra el ícono 🖼️, se cambió el estado a
"Disponible" y apareció la advertencia de "todavía no existe la pantalla", se guardó con una
descripción de prueba y la tarjeta se actualizó en la lista (pill verde, contador "5 disponibles
ahora"). Se revirtieron los cambios de prueba (estado, descripción) y se confirmó que la app móvil
vuelve a mostrar exactamente el estado original: 4 disponibles con foto, Taxi de nuevo en
"Próximamente" como ícono. Se borraron también las filas de auditoría generadas por la prueba.

## Pendiente explícito

Ninguno — este cierra el pendiente dejado por la decisión 0024.
