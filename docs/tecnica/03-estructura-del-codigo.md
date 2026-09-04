# Estructura del código — `apps/movil`

Proyecto Expo (SDK 57) + Expo Router + TypeScript, generado con `create-expo-app` y adaptado a la arquitectura del documento maestro.

```
apps/movil/
+-- app/                          Rutas (Expo Router, basado en archivos)
|   +-- _layout.tsx                Stack raíz + QueryClientProvider + banner sin conexión
|   +-- (tabs)/
|   |   +-- _layout.tsx             4 pestañas: Inicio, Servicios, Comunidad, Perfil
|   |   +-- index.tsx               Inicio (búsqueda, avisos, categorías, destacados)
|   |   +-- servicios/              Catálogo completo (Stack propio, ver detalle abajo)
|   |   +-- comunidad.tsx           Feed de avisos con filtro por categoría
|   |   +-- perfil.tsx              Mi perfil (stats, preferencias, soporte)
|   +-- negocio/[id].tsx           Ficha de negocio
|   +-- buscar.tsx                 Búsqueda a pantalla completa (fullScreenModal)
|   +-- notificaciones/            Bandeja + ajustes de notificaciones (ver sección abajo)
|
+-- src/
    +-- componentes/                Ver listado completo más abajo
    +-- config/
    |   +-- marca.ts                 Identidad reemplazable (sección 3 del doc maestro)
    |   +-- entorno.ts               EXPO_PUBLIC_DATA_SOURCE, url de API, comunidad por defecto
    |   +-- categoriasNotificacion.ts Categorías de notificación, config-driven (ver sección abajo)
    +-- datos/
    |   +-- contratos/               Interfaces de repositorio (el contrato)
    |   +-- mock/                    Implementación con datos de San Borja
    |   +-- api/                     (vacío — Etapa 2)
    |   +-- hooks/                   useNegocios, useNegocio, useCategorias, useComunidadesActivas,
    |   |                            useAvisos, useProductosPorNegocio (TanStack Query)
    |   +-- fabricaRepositorios.ts   Decide mock vs. api
    |   +-- queryClient.ts           networkMode: "always" (ver docs/decisiones/0003)
    +-- disenio/                    Tokens: colores, espaciado, tipografía
    +-- estado/
    |   +-- comunidadActiva.ts       Store de Zustand — comunidad seleccionada
    |   +-- useNotificaciones.ts     Store de Zustand — permiso + preferencias por categoría (UI, sin backend)
    |   +-- useNotificacionesLeidas.ts Store de Zustand — notificaciones leídas, solo en memoria
    |   +-- useBusquedasRecientes.ts Store de Zustand — historial de búsqueda en memoria
    +-- i18n/
        +-- es.ts                    Todos los textos visibles, con el nombre de marca inyectado
```

**Nota (2026-08-27):** las pestañas Buscar y Mapa se eliminaron de la navegación principal. Ver `docs/decisiones/0004-reorganizacion-navegacion-4-pestanas.md` para el porqué completo.

## `app/(tabs)/servicios/` — catálogo completo

Antes existían dos superficies separadas (`buscar/` con 4 guías, y `servicios.tsx` con solo un ítem activo). Ahora todo vive en una sola pila:

```
servicios/
+-- _layout.tsx        Stack con títulos por pantalla
+-- index.tsx           Catálogo: "Disponible ahora" (negocios, restaurantes, productos, supermarket)
|                        + "Próximamente" (los 8 servicios de fase 2)
+-- negocios.tsx         Guía de negocios — todas las categorías, con filtro visible
+-- productos.tsx        Guía de productos (= Market Space) — fija a categoriaId "cat-emprendimientos"
+-- restaurantes.tsx     Guía de restaurantes — fija a categoriaId "cat-restaurantes"
+-- supermarket.tsx      Supermarket — fija a categoriaId "cat-supermercado"
```

Las cuatro pantallas de listado reutilizan `src/componentes/GuiaListado.tsx` (buscador + lista paginada; el filtro de categorías solo se muestra cuando no hay una categoría fija).

**No repetir el título de la pantalla dentro del contenido**: como `servicios/index.tsx` ya recibe su título ("Servicios") del `Stack` en `_layout.tsx`, el componente no debe renderizar su propio `<Text>` de título — si no, queda duplicado. Aplica al resto de pantallas dentro de un `Stack` con `headerShown: true`.

### Rediseño visual de `servicios/index.tsx` (2026-08-27)

Pasó de una lista plana de filas a un catálogo visual, con el mismo lenguaje de tarjetas-con-sombra de Comunidad y Perfil:

- **Buscador arriba**: reusa `BarraBusqueda.tsx` (mismo componente de Inicio), abre `/buscar`.
- **"Disponible ahora" en grilla 2×2**: cada tarjeta tiene un ícono de color propio dibujado a mano en `src/componentes/IconoServicio.tsx` (mismo patrón que `IconoCategoria.tsx` — SVG con `react-native-svg`, no Ionicons). El subtítulo de "Guía de negocios" muestra el conteo **real** de negocios de la comunidad activa (`useNegocios({ comunidadId }).items.length`), nunca un número inventado.
- **"Próximamente" en grilla de 3 columnas** con borde punteado, en vez de una lista larga de filas grises — mismos íconos a mano por servicio (rescate animal, turismo, inmobiliaria, taxi, consultorías, bolsa de empleo, bolsa de puntos, otros).
- **Banner final** invitando a sugerir un servicio — solo visual por ahora, no envía nada a ningún lado todavía.
- **Ajuste 2026-08-27 (parte 2)**: la grilla 2×2 usaba `flexWrap` con ancho fijo, así que las tarjetas quedaban de distinta altura cuando el texto ocupaba distinto número de líneas (ej. "Guía de negocios" con descripción de 2 líneas vs "Restaurantes" con 1). Se cambió a dos filas explícitas (`flexDirection: "row"` por fila) para que ambas tarjetas de cada fila se estiren a la misma altura. También se le agregó sombra + fondo blanco a `BarraBusqueda.tsx` (antes usaba el mismo color que el fondo de la pantalla y no se distinguía).

### Rediseño de las guías de listado — `GuiaListado.tsx` y `TarjetaNegocio.tsx` (2026-08-27)

Como las 4 pantallas "disponible ahora" (negocios, restaurantes, productos, supermarket) reusan `GuiaListado.tsx`, un solo rediseño las actualiza a todas:

- Fondo de pantalla en `colores.superficieHundida` (antes blanco puro) para que las tarjetas floten con contraste.
- El buscador de texto pasó de un fondo apagado a blanco con sombra (mismo criterio que `BarraBusqueda`).
- **`TarjetaNegocio.tsx`** ahora es una tarjeta con sombra (no una fila plana): separador entre tarjetas vía `ItemSeparatorComponent` en el `FlashList`, check de verificado como círculo verde relleno (en vez del ícono outline de Ionicons), y flecha `chevron-forward` al final. Como `TarjetaNegocio` también se usa en Inicio ("Negocios cerca de ti") y en `buscar.tsx`, el rediseño se propagó a esas pantallas también.
- **Fotos reales, no íconos de relleno**: la miniatura muestra la foto real del negocio (`fotoPrincipalUrl`) cuando existe; si un negocio todavía no tiene foto subida, se muestra un bloque neutro (`colores.superficieHundida`) — nunca un ícono decorativo fingiendo ser una foto. Los 9 negocios del mock siguen sin foto real todavía.

## `app/negocio/[id].tsx` — ficha de negocio por arquetipo (2026-08-27)

La ficha ya no es "menú o galería" (binario según si el negocio tiene productos). Ahora cada **categoría** define un `arquetipoFicha` (`Categoria.arquetipoFicha`, en `paquetes/tipos/src/categoria.ts`) que decide qué bloque de contenido se muestra entre los botones de contacto y la dirección:

| `arquetipoFicha` | Componente | Categorías | Datos que usa |
|---|---|---|---|
| `menu` | `MenuNegocio.tsx` | Comida, Restaurantes | `Producto[]` (existente) |
| `catalogo` | `CatalogoNegocio.tsx` | Moda | `Producto[]` — mismo tipo que el menú, pero en grilla de fotos con chips de subcategoría (`categoriaMenu`) |
| `servicios` | `ServiciosNegocio.tsx` | Salud, Mascotas, Servicios | `Negocio.serviciosOfrecidos` (nuevo: nombre + detalle + precio) |
| `categorias` | `CategoriasRubroNegocio.tsx` | Hogar | `Negocio.rubrosDisponibles` (nuevo: `string[]`, sin precio — un catálogo de ferretería es demasiado amplio para listar producto por producto) |
| `ofertas` | `OfertasPasillosNegocio.tsx` | Supermercados | `Negocio.ofertas` + `Negocio.pasillos` (nuevos) |
| _(sin definir)_ | — | Emprendimientos | Ver resolución abajo |

**Cómo se resuelve** (`src/utilidades/arquetipoFicha.ts` → `resolverArquetipoFicha`): recorre `negocio.categoriaIds` en orden y usa el arquetipo de la primera categoría que lo tenga definido. "Emprendimientos" no define arquetipo a propósito porque agrupa negocios muy distintos (una postrería no es lo mismo que una tienda de tejidos) — queda como comodín.

**Cadena de respaldo en `negocio/[id].tsx`** (nunca se rompe, nunca inventa datos): si el arquetipo resuelto no tiene los datos que necesita (ej. categoría "servicios" pero el negocio no cargó `serviciosOfrecidos`), o si la categoría no definió arquetipo, se revisa si el negocio tiene `Producto[]` cargados y se muestra `MenuNegocio` (así "Postres Doña Herminia", en Emprendimientos, conserva su menú). Si tampoco hay productos, se muestra `GaleriaNegocio` — la galería genérica de fotos que ya existía.

**Agregar una categoría nueva**: se le asigna un `arquetipoFicha` de la tabla de arriba al crearla (una sola vez, no por negocio). Si no se le asigna ninguno, cualquier negocio de esa categoría cae en la cadena de respaldo del párrafo anterior.

**Horario rediseñado**: `ResumenHorario.tsx` reemplazó la lista vertical de 7 días por un estado destacado ("● Abierto ahora · cierra 20:00", vía `estadoHoyTexto` en `utilidades/horarios.ts`) más una fila compacta de 7 celdas (L M M J V S D) con el día de hoy resaltado y un punto de color por día abierto/cerrado (`resumenSemana`).

**Afinado 2026-08-27, tras comparar con el boceto:**
- **`estadoHoyTexto` ahora dice cuándo vuelve a abrir** cuando el negocio está cerrado (antes solo decía "Cerrado hoy" sin más info): si el negocio abre más tarde el mismo día, dice "abre hoy 09:00"; si el día de hoy es de descanso o ya cerró, busca el próximo día que abre y dice "abre mañana 09:00" o "abre el lunes 09:00" (`proximaApertura`).
- **La fila compacta de 7 días ahora es expandible**: un botón "Ver horario completo" debajo revela la lista día por día con sus horas exactas (`listaSemanaCompleta`) — antes la fila compacta solo mostraba abierto/cerrado por punto de color, sin las horas de otros días.
- **Regla final sobre íconos vs. neutro** (corregido tras una primera pasada equivocada): el criterio no es "por arquetipo", es **"¿ese espacio va a tener una foto real subida por el negocio?"**
  - **Si sí** (foto principal, miniatura en listas — `TarjetaNegocio` —, foto de cada plato en `MenuNegocio`, foto de cada producto en `CatalogoNegocio`, foto de cada oferta en `OfertasPasillosNegocio`, y `GaleriaNegocio`): bloque **neutro** (`colores.superficieHundida`), sin ícono — no hay que insinuar una foto que todavía no existe.
  - **Si no** (esos slots nunca tendrán foto, son iconografía permanente): **emoji idéntico al del boceto**, con su color natural — `CategoriasRubroNegocio` (🎨 Pintura, 💡 Electricidad, 🚰 Gasfitería, 🔧 Herramientas, 🔒 Cerrajería, 🌱 Jardinería) y `ServiciosNegocio` (🧺 Lavado, 👔 Planchado, 🛏️ Edredón, 🩺 Consulta, 💉 Vacunación, ✂️ Baño y corte — mapeado por nombre del servicio, con 🏷️ de reserva para nombres no listados).

## `app/(tabs)/comunidad.tsx` — muro social de la zona (rediseño 2026-08-27)

Reemplaza a la antigua `app/informacion-local.tsx`. Se rediseñó como un muro tipo Facebook/X — solo lectura, sin comentarios — para que la comunidad se sienta viva y visual, no como una lista de boletines. Chips de filtro: **Todo, Municipal, Junta vecinal, Seguridad, Perdidos**. Solo las tres primeras tienen datos reales (filtran por el campo `categoria` del aviso); "Perdidos y encontrados" muestra un estado "Próximamente" — no se fabricaron datos falsos porque no existe todavía el modelo (`ObjetoPerdido`) ni su repositorio. **"Reseñas" se eliminó por completo de Comunidad** (a pedido explícito): las reseñas de negocios vivirán en otro lugar de la app cuando se construyan, no aquí.

Cada aviso se ve con `src/componentes/TarjetaAviso.tsx`: avatar de color por categoría, nombre de la fuente (Municipalidad, Sedapal, Serenazgo, Junta Vecinal…) con check de verificado cuando corresponde, tiempo relativo (`utilidades/tiempoRelativo.ts`), imagen opcional (`Aviso.imagenUrl`, `null` en todo el mock — **nunca se fabrica una foto de relleno**; solo se sube cuando la fuente suba una foto real), y dos acciones al pie:

- **Me interesa**: contador visible (`Aviso.meGusta`, semilla del mock) + un toggle personal en `src/estado/useMeInteresa.ts` (Zustand, solo en memoria de esta sesión). El número que ve el usuario es semilla + su propio toggle — todavía no hay backend que agregue el "me interesa" real entre todos los vecinos (eso es Etapa 2).
- **Compartir**: usa la API nativa `Share` (mismo patrón que "Invitar a vecinos" en Perfil), así el vecino puede reenviar el aviso por WhatsApp o cualquier otra app instalada.

No hay botón de comentar ni caja para publicar — es intencional, a pedido del cliente: los vecinos solo visualizan y comparten.

**Afinado 2026-08-27:**
- **Esqueleto de carga propio** (`EsqueletoAviso.tsx` / `EsqueletoListaAvisos`) con forma de publicación (avatar redondo + líneas de título/cuerpo), en vez de reusar el esqueleto de tarjeta de negocio.
- **Pull-to-refresh** en el `ScrollView` (`RefreshControl` ligado a `refetch`/`isRefetching` de `useAvisos`).
- **Separadores de fecha** (`utilidades/agruparAvisos.ts` → `agruparPorFecha`): agrupa en "Hoy", "Esta semana", "Anteriores" según `publicadoEn`.
- **Alertas de seguridad fijadas arriba** del feed bajo el encabezado "Alertas activas", solo cuando el filtro es "Todo" — no se agrupan por fecha junto al resto para que no se pierdan entre avisos más nuevos.
- **Imagen a pantalla completa**: tocar la foto de un aviso abre `VisorImagen.tsx` (modal a pantalla completa, cierra al tocar la imagen o la X).

**Afinado 2026-08-27 (parte 2), a pedido del cliente tras comparar con el boceto:**
- **Chips de filtro** (`ChipCategoria.tsx`): el chip activo ahora es oscuro (`colores.texto`) con punto blanco, y los inactivos son blancos con borde — igual al boceto. Antes el activo usaba el verde de marca, que no coincidía.
- **Pie de cada publicación simplificado**: ya no dice "Me interesa" ni "Compartir" en texto — solo ícono + número. El corazón usa el conteo de siempre (`meGusta`); compartir ahora también tiene su propio conteo (`Aviso.compartidos`, campo nuevo con semilla en el mock) que solo sube cuando el sistema confirma que el usuario completó el share nativo (`Share.sharedAction`), no si cancela — se registra en `src/estado/useComparticiones.ts`, mismo patrón que `useMeInteresa.ts`. El ícono de compartir cambió a `paper-plane-outline` para distinguirlo visualmente del de "me interesa".

## `app/buscar.tsx` — búsqueda a pantalla completa (rediseño 2026-08-27)

Se abre desde la barra de búsqueda en Inicio (`presentation: "fullScreenModal"` en el Stack raíz). Al escribir, filtra negocios en vivo con `useNegocios({ comunidadId, busqueda })` — el mismo hook que usa `GuiaListado`. Sin texto escrito, muestra en orden:

- **Tus últimas búsquedas** (`useBusquedasRecientes`, Zustand en memoria): cada fila ahora muestra un ícono e categoría reales cuando el término coincide con el nombre de un negocio de la comunidad (`storefront-outline` + su primera categoría, ej. "Comida"); si no coincide con ningún negocio, muestra `time-outline` + "Búsqueda reciente". Cada fila tiene su propio botón "✕" (`useBusquedasRecientes.quitar`), además de "Limpiar" para borrar todas.
- **Banner de ofertas** ("Solo para ti — Ofertas de tus negocios de siempre"): junta las ofertas de **todos** los negocios de la comunidad con `src/utilidades/ofertas.ts` → `recolectarOfertas` (recorre `Negocio.ofertas`, sin filtrar por categoría ni rubro — cualquier negocio puede aparecer aquí, no solo supermercados). Cada tarjeta muestra el nombre del negocio, el precio tachado (`OfertaNegocio.precioOriginal`, campo nuevo y opcional) y el precio final; toca la tarjeta para ir a la ficha de ese negocio. Si ningún negocio tiene ofertas cargadas, la sección no se muestra (nunca aparece vacía).
- **Negocios más visitados**: fila horizontal de avatares circulares con las iniciales del negocio (incluye el mismo caveat que "El más visitado" de Inicio — es el orden del mock, no una métrica real de visitas todavía).
- **Banner de anuncio**: una tarjeta de `anunciosMock` (mismo archivo que alimenta el carrusel de Inicio), sin la etiqueta "Publicidad" — a pedido explícito, no se quería esa palabra visible.
- **Búsquedas que son tendencia**: ahora con categoría debajo de cada término y un "Mostrar más búsquedas" que expande la lista completa (antes eran chips sueltos sin categoría ni forma de ver más).

## Notificaciones (2026-08-27)

Al tocar la campana en `BarraSuperior`: si `useNotificaciones().permisoDecidido` es `false`, se muestra `PermisoNotificaciones` (modal de pantalla completa, mismo patrón que la pantalla de bienvenida — explicar antes de pedir). Una vez decidido, la campana navega a `/notificaciones` (antes iba directo a `/comunidad`). No hay integración real con `expo-notifications` ni con un backend de push todavía (eso es Etapa 2) — esto es la bandeja y las preferencias dentro de la app.

```
app/notificaciones/
+-- _layout.tsx     Stack propio; index tiene ícono de ajustes (⚙) en headerRight → /notificaciones/ajustes
+-- index.tsx        Feed: alertas de seguridad, avisos de comunidad, ofertas de negocios, novedades
+-- ajustes.tsx      Preferencias por categoría, agrupadas por Comunidad / Negocios / App
```

**Categorías config-driven, no hardcodeadas** (`src/config/categoriasNotificacion.ts`): un array `CATEGORIAS_NOTIFICACION` (id, grupo, nombre, descripción, emoji, colores, `porDefecto`) más `GRUPOS_NOTIFICACION` para las 3 secciones. Tanto el feed como la pantalla de ajustes derivan de este array — agregar una categoría nueva (o un grupo nuevo) es un solo objeto más, sin tocar la lógica de ninguna de las dos pantallas. Se dejó así a pedido explícito del cliente ("que sea escalable y no me limite a algo").

**"Alertas de seguridad" es togglable, no bloqueada**: por defecto viene activada (`porDefecto: true`) porque es información de seguridad del vecindario, pero el usuario puede desactivarla como cualquier otra categoría — el boceto original la mostraba como un toggle bloqueado/deshabilitado, pero el cliente pidió explícitamente que no lo esté.

**`useNotificaciones`** ahora también guarda `preferencias: Record<string, boolean>` (inicializado desde `porDefecto` de cada categoría) y `alternarCategoria(id)`. **`useNotificacionesLeidas`** (Zustand, solo en memoria de la sesión — mismo patrón que `useMeInteresa`/`useComparticiones`) trackea qué notificaciones ya se tocaron, para el punto rojo de "sin leer".

**Sin fechas ni horas inventadas**: el feed muestra `tiempoRelativo` solo en las notificaciones que tienen un dato real de fecha (los avisos, con `publicadoEn`). Las ofertas y las novedades de la app no tienen una fecha real detrás todavía, así que sus tarjetas no muestran ninguna hora — inventar un "hace 2h" ahí sería un dato falso.

**Iconografía**: todos los íconos de categoría son emoji idénticos al boceto (🚨 🏛️ 🎉 🏪 ✨) con su color de fondo propio — no son slots de foto real, así que aplica la misma regla de "íconos permanentes" que `CategoriasRubroNegocio`/`ServiciosNegocio` en la ficha de negocio.

## Perfil (rediseño visual, 2026-08-27)

Pasó de ser una lista plana a secciones agrupadas en tarjetas con sombra, siguiendo el mismo lenguaje visual de Comunidad:

- **Encabezado**: panel verde suave (`colores.primarioSuave`) con avatar, insignia de badge "Vecino de · {comunidad}" (mismo estilo de insignia que el encabezado de Comunidad, para dar continuidad visual).
- **Reseñas y Favoritos**: dos tarjetas marcadas explícitamente "Próximamente" (ligeramente atenuadas con `opacity`) en vez de mostrar un contador en `0` — ninguna de las dos funciones existe todavía (no hay modelo `Resena` ni sistema de favoritos), así que un `0` daba a entender que la función ya existía. Decisión tomada tras feedback directo del cliente.
- **Preferencias y Soporte**: cada sección vive en una sola tarjeta agrupada (`Grupo` en `perfil.tsx`) con filas separadas por un borde interno — no tarjetas sueltas por fila. La primera fila de cada grupo no lleva borde superior (prop `primero` en `FilaPerfil`/`FilaInterruptor`).
- **"Invitar a vecinos"**: tarjeta CTA propia en `colores.acentoFuerte`, separada de las listas de ajustes — usa la API `Share` de React Native.
- **"Cerrar sesión"**: fila en rojo/coral, marcada "Próximamente" — la app todavía no tiene sistema de cuentas ni login (Etapa 1 es 100% datos de prueba), así que no tiene una acción real detrás todavía.
- Interruptor de notificaciones sigue ligado al store real (`useNotificaciones`); "Modo oscuro" sigue deshabilitado y marcado "Próximamente" (es solo UI, no cambia el tema todavía).

## Barra superior y hoja inferior

`src/componentes/BarraSuperior.tsx` (usada en Inicio) muestra el chip de comunidad activa y la campana. Tocar el chip o la fila "Cambiar de comunidad" en Mi perfil abren la misma hoja inferior (`HojaInferior.tsx` + `SelectorComunidad.tsx`, ver `docs/decisiones/0002-...`).

## Estructura de Inicio (rediseño visual, 2026-08-27)

De arriba hacia abajo: `BarraSuperior` (saludo personalizado según hora del día + ilustración SVG, en vez del chip de ubicación) → `BarraBusqueda` (abre `/buscar`) → `CarruselAvisos` (auto-rotación cada 4.5s, fondo con forma orgánica SVG) → categorías ("Explora por tipo", primera tarjeta más grande, con íconos SVG dibujados a mano en `IconoCategoria.tsx` en vez de Ionicons) → `CarruselPublicidad` (auto-rotación cada 6s, sin etiqueta "Publicidad" — contenido/tiempos editables en `datos/mock/anuncios.mock.ts`) → `TarjetaDestacadoGrande` (negocio más visitado, spotlight) → `RielMiniNegocios` (riel horizontal deslizable, 5-6 negocios) → lista "Negocios cerca de ti" (`TarjetaNegocio`, ahora con distintivo de verificado, estado abierto/cerrado y minutos caminando).

Se eliminaron `TarjetaHero.tsx` y `FilaDestacados.tsx` (superados por lo anterior).

**Tocar una categoría navega** a `/servicios/negocios?categoriaId=...` (ver `alTocarCategoria` en `index.tsx`), preseleccionando el filtro en `GuiaListado` a través de la prop `categoriaIdFija`.

**Tipografía de acento**: se agregó la familia Fraunces (`@expo-google-fonts/fraunces`, cargada en `app/_layout.tsx` con `useFonts`) para títulos y saludos — siempre en semibold/bold, nunca cursiva (tokens `tipografia.display`, `displayGrande`, `displaySeccion`).

**Utilidades nuevas** (`src/utilidades/`): `saludo.ts` (saludo según hora), `horarios.ts` (`estaAbiertoAhora`, compara contra el modelo `Horarios` del negocio), `distancia.ts` (`minutosCaminando`, fórmula de Haversine desde un punto de referencia fijo `CENTRO_COMUNIDAD_REFERENCIA` — placeholder hasta que se capture geolocalización real del usuario en una fase futura).

## Login (2026-08-27)

`app/_layout.tsx` es ahora el gate de acceso: si `useSesion().autenticado` es `false`, renderiza `FlujoLogin` (src/componentes/FlujoLogin.tsx) en vez del `Stack` principal — mismo patrón de "reemplazar todo el árbol" que se usaba antes para la bienvenida de ubicación (ya eliminada a pedido del cliente).

`FlujoLogin.tsx` es un wizard de 3 pasos con estado local (no son rutas de Expo Router — es un flujo previo a la navegación real, sin necesidad de URLs propias):

1. **Teléfono**: número + prefijo 🇵🇪 +51, botón "Continuar con Google" marcado **Próximamente** (visual, sin acción — no se fabrica un login social que no existe), y un enlace **"Continuar sin iniciar sesión (modo prueba)"** para entrar sin pasar por nada — pensado para probar la app rápido mientras no hay backend de verdad.
2. **Código**: 6 casillas de un dígito con auto-avance de foco. **Cualquier código de 6 dígitos verifica correctamente** — se lo dice explícitamente al usuario en el pie de pantalla, en vez de simular un SMS real que no se envía.
3. **Perfil**: nombre y apellido (obligatorios para continuar), más la comunidad activa si ya se detectó una.

**`src/estado/useSesion.ts`** (Zustand, solo en memoria — se resetea en cada recarga completa, igual que el resto de stores de sesión del proyecto): `autenticado`, `usuario` (`null` si entró como invitado), `iniciarSesion`, `continuarComoInvitado`, `cerrarSesion`. **"Cerrar sesión" en Perfil ya es funcional** (antes decía "Próximamente" porque no existía nada detrás) y vuelve a mostrar el login.

**No hay backend de autenticación real todavía** (Etapa 2): no se envía SMS, no se verifica el número, no hay persistencia de sesión entre recargas — es la interfaz completa del flujo, lista para conectarse cuando exista el backend.

## Paleta de color (definida 2026-08-26)

Fondo blanco. Verde como color principal (identidad de San Borja) y coral como acento — usado también para resaltar la pestaña Comunidad en el tab bar (círculo de color detrás del ícono, siempre visible, no solo al estar activo). Tokens en `src/disenio/colores.ts`, valores base en `src/config/marca.ts`.

## Decisiones tomadas al scaffoldear

- **Identificadores neutros**: `app.json` usa `slug: "app-vecinos"` y `package`/`bundleIdentifier: "pe.appvecinos.movil"`.
- **Sin librería de mapas**: la pestaña Mapa se eliminó de la navegación (ver ADR 0004); si se reintroduce, sería como vista dentro de un listado, no como destino propio.
- **Bienvenida como gate, no como ruta**: ver `docs/decisiones/0001-...`.
- **Etiquetas del tab bar renderizadas a mano**: React Navigation le da una altura fija (7px) a su wrapper de etiqueta por defecto, que recorta el texto en web. La solución fue `tabBarShowLabel: false` + un componente propio que dibuja ícono y texto juntos (ver `(tabs)/_layout.tsx`).

## Cómo correrlo

```bash
cd apps/movil
npm run web    # o: npx expo start --web
```

Con `EXPO_PUBLIC_DATA_SOURCE` sin definir, usa automáticamente los datos mock de San Borja.
