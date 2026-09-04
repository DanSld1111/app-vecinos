# Modelo de datos — contrato compartido

Fuente única: `paquetes/tipos/src/`. Estos tipos son el contrato entre pantallas y datos (sección 6 del documento maestro). La implementación mock y la futura API real deben cumplir exactamente estas formas.

## Jerarquía geográfica (`geografia.ts`)

```
Departamento -> Provincia -> Distrito -> Comunidad
```

- `Comunidad` es la unidad operativa del producto (más pequeña que el distrito). El piloto es `com-san-borja` dentro del distrito San Borja (UBIGEO `150140`).
- `Coordenada` se representa siempre como `{ lat, lng }`, nunca como columnas sueltas ni texto.

## `Negocio` (`negocio.ts`)

Entidad núcleo del directorio (servicio 1 del catálogo). Campos relevantes:

- `categoriaIds`: relación muchos-a-muchos con `Categoria`.
- `horarios`: objeto `Horarios`, un `HorarioDia` por cada día de la semana (`{ cerrado, abre?, cierra? }`). Sustituye al `JSONB` crudo del modelo de base de datos por una forma tipada y predecible en la app.
- `verificadoEn` y `fuente`: obligatorios en todo registro de contenido (criterio de calidad permanente, sección 13 del documento maestro).
- `estado`: `"activo" | "inactivo" | "por_verificar"`.
- `fotoPrincipalUrl`: subida real por el dueño (`POST /negocios/:id/foto`, multipart, JPG/PNG/WEBP hasta 5MB) — almacenamiento local en disco por ahora (`apps/api/uploads/negocios/`, servido vía `/uploads/`), reemplazable por un CDN sin tocar el resto del código. Ver [decisión 0021](../decisiones/0021-endurecimiento-post-diagnostico.md).
- `fotosGaleria`: hasta 6 URLs, subidas/borradas por el dueño (`POST`/`DELETE /negocios/:id/galeria`) desde "Mi negocio → Fotos". Solo se usan en la ficha cuando el negocio no tiene menú, catálogo, servicios ni ofertas — ver `GaleriaNegocio.tsx` y [decisión 0028](../decisiones/0028-fotos-productos-galeria-y-publicidad.md).

## `Producto` (`producto.ts`)

El menú/carta de un negocio (servicio 3, "Restaurantes: cartas y menús") o el catálogo de un emprendimiento de Market Space. Cada `Producto` pertenece a un `negocioId` y tiene `categoriaMenu` (texto libre: "Entradas", "Parrillas", "Postres"...) para agruparlo dentro de la ficha. `destacado` marca los ítems que se resaltan como "Más pedido". `fotoUrl`: subida por el dueño (`POST /negocios/:id/productos/:productoId/foto`) — solo pone/cambia la foto de un producto que ya existe, no hay alta/edición de productos desde el panel todavía (ver decisión 0028).

**Regla de la ficha de negocio**: si el negocio tiene productos, se muestra `MenuNegocio` (carta agrupada por categoría) o `CatalogoNegocio` (grilla, para Market Space y boutiques) según el arquetipo. Si no tiene ninguno (ferreterías, veterinarias, servicios en general), se muestra `GaleriaNegocio` en su lugar — la galería genérica del negocio si subió fotos, o una cuadrícula de ejemplo si no. Ningún negocio se queda sin una de las dos secciones.

La dirección siempre se acompaña de `MiniMapaNegocio`: una vista previa con el pin del negocio y un botón "Abrir en Google Maps" que usa `Linking.openURL` con el esquema `https://www.google.com/maps/search/?api=1&query=lat,lng` (no requiere API key de Google).

## `Aviso` (`aviso.ts`)

Contenido de "Información local": avisos municipales, de la junta vecinal o de seguridad. `categoria` decide el ícono que se muestra.

## `Profesional` (`profesional.ts`)

Cubre los servicios 9, 10 y 11 (médicos, veterinarios, legal/contable). Lleva `colegiaturaNumero`, `colegiaturaEntidad` y `colegiaturaVerificadaEn` porque la verificación la respalda el colegio profesional, no la app.

## `Categoria` (`categoria.ts`, ver [decisión 0029](../decisiones/0029-categorias-con-foto.md))

Jerárquica mediante `padreId` (permite subcategorías cuando el catálogo crezca). `fotoUrl`:
reemplaza al ícono (`icono`) en la tarjeta grande de Inicio — el ícono se mantiene como respaldo
para una categoría nueva que todavía no tiene foto subida, nunca se elimina del todo. Editable
desde el panel admin (`POST/PATCH /categorias`, `POST /categorias/:id/foto`).

## `ServicioApp` (`servicio.ts`, ver [decisión 0025](../decisiones/0025-servicios-editables-desde-admin.md))

Una fila por cada una de las 12 tarjetas de la pantalla Servicios (`slug` fijo, catálogo chico sin
paginación — mismo patrón que `Categoria`). `nombre`, `descripcion`, `estado`
(`disponible`/`proximamente`) y `fotoUrl` son editables desde el panel admin; el `slug`, el ícono
y la ruta de navegación siguen fijos en el código porque están atados a pantallas reales que no
existen todavía para los servicios en "próximamente".

## `Anuncio` (`anuncio.ts`, ver [decisión 0028](../decisiones/0028-fotos-productos-galeria-y-publicidad.md))

Espacios de publicidad interna gestionados desde el panel admin ("Publicidad", solo super_admin):
`ubicaciones` (`"carrusel_inicio" | "banner_buscar"`, un mismo anuncio puede vivir en más de un
espacio), `negocioId` opcional (si se define, tocarlo navega a esa ficha), y `fechaInicio`/
`fechaFin` para programar su vigencia. `GET /anuncios` (público, el que consume la app) solo
devuelve los `activo` y vigentes hoy — el panel usa `GET /anuncios/admin` para ver también los
programados, vencidos o pausados.

## Paginación (`comun.ts`)

Todo listado usa `ResultadoPaginado<T>` con `cursorSiguiente`. Nunca se devuelven colecciones completas — regla de rendimiento de la sección 7.2 del documento maestro.

## Borrado suave, auditoría y push (ver [decisión 0021](../decisiones/0021-endurecimiento-post-diagnostico.md))

- `usuarios_app`, `cuentas` y `avisos` tienen `eliminado_en TIMESTAMPTZ` (NULL = activo). Ningún
  `DELETE FROM` real sobre estas tablas: toda baja es un `UPDATE ... SET eliminado_en = now()`, y
  toda lectura filtra `AND eliminado_en IS NULL`.
- Tabla `auditoria` (global, sin tipo compartido propio — es un detalle de servidor, no de
  contrato con el cliente): quién hizo qué, sobre qué entidad, cuándo. Nunca bloquea la acción que
  audita si falla al escribirse.
- `usuarios_app.push_token`: token de push de Expo del vecino, si activó notificaciones y ya
  existe un build nativo capaz de generarlo (ver decisión 0021, sección 5).

## Capa de repositorios (en `apps/movil/src/datos/`)

```
contratos/          Interfaces (el contrato): RepositorioNegocios, RepositorioComunidades, RepositorioCategorias, RepositorioServicios, RepositorioAnuncios
mock/                Implementación con datos simulados de San Borja
api/                 Implementación real contra apps/api (ver decisión 0013) — negocios, productos, comunidades, categorías, avisos, servicios, anuncios
fabricaRepositorios.ts   Decide qué implementación usar según EXPO_PUBLIC_DATA_SOURCE (mock por defecto)
```

Ningún componente de pantalla importa `mock/` ni `api/` directamente: siempre consume la instancia exportada por `fabricaRepositorios.ts`.

## Estado

- [x] Tipos compartidos (`paquetes/tipos`)
- [x] Interfaces de repositorio
- [x] Implementación mock con datos de San Borja
- [ ] Especificación OpenAPI completa (`05-api-contrato.yaml` — borrador inicial)
- [x] Esquema SQL real con PostGIS (`infraestructura/migraciones/`, ver [decisión 0005](../decisiones/0005-esquema-base-de-datos.md))
- [x] Backend NestJS (`apps/api`) — **Etapa 2 cerrada**: 7 módulos reales — `geografia`, `categorias`, `negocios` (+ productos) ([0006](../decisiones/0006-estructura-api-nestjs.md)), `cuentas`/auth con JWT ([0007](../decisiones/0007-modulo-cuentas-auth.md)), `contenido` (avisos), `usuarios` (vecinos) ([0008](../decisiones/0008-modulos-avisos-vecinos.md)) y `profesionales` ([0012](../decisiones/0012-cierre-etapa-2-profesionales.md)). Solo `pagos` queda fuera, a propósito.
- [x] Semillas SQL con los datos de ejemplo actuales (`infraestructura/datos-semilla/`)
- [x] Catálogo geográfico nacional completo: 25 departamentos, 196 provincias, 1892 distritos (fuente real INEI/RENIEC vía `ubigeo-peru-aumentado`, MIT), todos `activo=false` salvo el piloto — expandir a una comunidad nueva es activar un registro, nunca una migración. Ver [decisión 0019](../decisiones/0019-catalogo-ubigeo-nacional.md)
- [x] Validado en vivo contra Postgres 18 + PostGIS real local — ver [decisión 0009](../decisiones/0009-validacion-en-vivo.md)
- [x] Registro y login real de vecinos (correo + clave, JWT propio) — primera pantalla de `apps/movil` conectada a `apps/api` de verdad, ver [decisión 0010](../decisiones/0010-registro-vecinos-correo-clave.md)
- [x] Recuperación de contraseña (código de 6 dígitos) para cuentas del panel y vecinos, validada en vivo en ambas plataformas — ver [decisión 0011](../decisiones/0011-recuperacion-de-clave.md)
- [x] `apps/admin` conectado a `apps/api`: `Login`/`useSesionAdmin`, `Usuarios`, `Cuentas` y todo el árbol de `Avisos` (`Avisos`, `MisAvisos`, `ColaValidacion` lado avisos, `HistorialValidaciones`) ya son reales, no mock. Ver [decisión 0014](../decisiones/0014-admin-cuentas-avisos-conectados.md)
- [x] `apps/movil` conectado a `apps/api` para lecturas (negocios, productos, comunidades, categorías, avisos) — probado en vivo, `mock` sigue siendo el default. Ver [decisión 0013](../decisiones/0013-movil-conectado-a-api.md)
- [x] Backend de gestión de negocios (crear, editar info/horarios/ofertas, aprobar/rechazar) con autorización por propiedad (`verificarPropiedad`) además de por alcance de distrito. `Negocios.tsx`, el lado de negocios en `ColaValidacion`/`HistorialValidaciones`, y el autoservicio del dueño (`MiNegocio`, `MiNegocioHorario`, `MiNegocioOfertas`) ya son reales. Ver [decisión 0015](../decisiones/0015-negocios-conectados.md)
- [x] `apps/admin` responsive para móvil, tablet y escritorio (barra lateral fija en escritorio, panel deslizable con botón de menú por debajo de 1024px; grillas y filas de lista se adaptan al ancho). Validado por medición (cero desborde horizontal) en las 22 rutas de las cuatro cuentas, en 375px/820px/1280px. Ver [decisión 0016](../decisiones/0016-panel-admin-responsive.md)
- [x] "Modo gestión" en `apps/movil`: dueño de negocio (editar información/horario/ofertas) y junta vecinal (redactar, corregir y reenviar avisos) publican contenido real desde la app, con su propia cuenta — sistema de sesión separado del login de vecino. Bug real encontrado y corregido en el camino (también existía en `apps/admin`): reenviar un aviso rechazado mandaba campos que el servidor rechaza. Ver [decisión 0017](../decisiones/0017-escribir-desde-movil.md)
- [x] Índice de búsqueda de negocios (Meilisearch) — tolerancia a errores de tipeo/acentos y orden por relevancia; con respaldo automático a `ILIKE` si el índice no está disponible, nunca rompe la búsqueda. Ver [decisión 0018](../decisiones/0018-indice-de-busqueda.md)
- [x] Catálogo geográfico nacional completo (departamentos/provincias/distritos, fuente real INEI/RENIEC), CORS restringido a la lista real de orígenes, dependencias vulnerables actualizadas (NestJS v11, react-router-dom v7), y `networkMode` de TanStack Query revisado (pendiente desde Etapa 1) — ahora conectado a la detección real de conectividad (`NetInfo`), distinto entre modo `mock` y `api`. Ver [decisión 0019](../decisiones/0019-catalogo-ubigeo-nacional.md) y [decisión 0020](../decisiones/0020-dependencias-cors-cache.md)
- [x] Endurecimiento post-diagnóstico: subida real de fotos de negocio, borrado suave + auditoría (`usuarios_app`/`cuentas`/`avisos`), paginación en los 3 listados admin que faltaban, manejo real de sesión expirada (401), notificaciones push reales (backend completo; celular real pendiente de un build EAS), y primera suite de tests automatizados (21 tests, `apps/api`). Ver [decisión 0021](../decisiones/0021-endurecimiento-post-diagnostico.md)
- [x] Revisión de diseño en `apps/movil`: modo oscuro real (antes decorativo), un solo patrón de "sin foto" en toda la app (avatares de iniciales con color estable por negocio + íconos para espacios grandes — corrigiendo de paso que la foto principal de una ficha nunca se mostraba), etiquetas de categoría ya no se cortan, y pills de estado unificados en `apps/admin`. Ver [decisión 0022](../decisiones/0022-diseno-post-revision.md)
- [ ] Carga del directorio real de negocios de San Borja (sigue con datos de ejemplo; pendiente hasta que se entregue la información real) — resto de Etapa 3
- [ ] Checkbox real de "aceptar términos" en el registro de vecino (hoy es solo texto estático) — deferido a propósito, ver decisión 0021
