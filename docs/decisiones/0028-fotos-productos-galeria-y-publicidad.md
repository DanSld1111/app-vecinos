# 0028 — Fotos por producto, galería del negocio y Publicidad conectada de verdad

## Contexto

Cierre de los 3 pendientes identificados en la revisión de diseño (ver
[0027](0027-ofertas-con-foto-y-boton-volver.md)): los platos de un menú y los productos de un
catálogo (Market Space, boutiques) mostraban siempre el mismo ícono genérico sin importar cuál
fuera; la sección "Fotos del negocio" que aparece cuando un negocio no tiene menú/catálogo/
servicios era 100% de ejemplo, sin forma de subir fotos reales; y la página "Publicidad" del
panel admin —aunque ya tenía una interfaz completa y bien pensada (nombre, detalle, dónde
aparece, negocio vinculado, vigencia por fechas, subir imagen)— nunca estuvo conectada a un
servidor: guardaba todo en memoria del navegador, y la app móvil leía sus propios anuncios de
ejemplo desde un archivo aparte. Cambiar algo en el panel no movía nada en la app.

Los 3 comparten la misma solución de fondo: agregarles una foto real, con su propio mecanismo de
subida desde el panel — el mismo patrón que ya se usó para Servicios ([0025](0025-servicios-editables-desde-admin.md)).

## Decisión

### 1. Foto por producto

`productos` no tenía columna de foto — se agregó `foto_url TEXT` (migración
`0012_fotos_producto_y_galeria.sql`). Como todavía no existe un alta/edición de productos desde
el panel (se cargan por migración o carga manual), el alcance quedó acotado a poner/cambiar la
foto de un producto que ya existe — no se construyó un CRUD completo de productos, sería un
cambio mucho más grande que "agregar una foto donde falta".

- **Backend**: `POST /negocios/:id/productos/:productoId/foto` (mismo mecanismo de subida que
  fotos de negocio/servicio — multer a disco, reemplaza el archivo anterior). Requiere sesión;
  la propiedad se valida igual que el resto del módulo de negocios (dueño asignado o
  super_admin).
- **Panel admin**: la pantalla "Mi negocio → Fotos" del dueño de negocio ahora, debajo de la foto
  principal, lista los productos de ese negocio (leídos del endpoint público
  `GET /negocios/:id/productos` que ya existía) con un botón "Subir foto"/"Cambiar" por cada uno.
- **App móvil**: `MenuNegocio.tsx` (platos con precio) y `CatalogoNegocio.tsx` (grilla de
  productos) muestran la foto real si existe, y el mismo ícono genérico de antes si no —
  comportamiento idéntico al de las ofertas en la decisión 0027.
- **Datos de ejemplo**: los 17 productos de los 5 negocios de ejemplo que tienen menú/catálogo
  (El Fogón, Panadería Los Rosales, Postres Doña Herminia, Tejidos Andinos SB, Boutique El
  Jardín) recibieron una foto de Unsplash genérica de su plato/artículo — mismo criterio de
  licencia y de evitar texto/marca/país que en las decisiones 0024 y 0026. 3 de esas fotos
  reusan la misma imagen ya elegida para el negocio o su anuncio, cuando el producto es
  literalmente esa misma cosa (la parrilla mixta de El Fogón, el pan francés de la panadería, la
  torta de Doña Herminia).

### 2. Galería genérica del negocio

`negocios` no tenía forma de guardar varias fotos — se agregó `fotos_galeria TEXT[]` (mismo
archivo de migración), limitado a 6 fotos por ser un espacio secundario (solo se usa cuando el
negocio no tiene menú, catálogo ni servicios cargados — ver `GaleriaNegocio.tsx`).

- **Backend**: `POST /negocios/:id/galeria` (agrega una foto, rechaza pasar de 6) y
  `DELETE /negocios/:id/galeria` (borra una por su URL, y el archivo del disco).
- **Panel admin**: nueva sección "Galería del negocio" en "Mi negocio → Fotos", con una grilla de
  hasta 6 casilleros — cada foto subida tiene su botón de borrar, y mientras queden casilleros
  libres se puede seguir agregando.
- **App móvil**: `GaleriaNegocio.tsx` ahora recibe las fotos del negocio y las muestra en los
  primeros recuadros (reemplazando el ícono genérico de esa categoría), dejando el aviso de
  "fotos de ejemplo" solo cuando de verdad no hay ninguna subida.
- **Nota de alcance**: ninguno de los 9 negocios de ejemplo cae hoy en este caso (los 9 tienen
  menú, catálogo, servicios u ofertas) — la función quedó construida y probada de punta a punta
  contra el servidor real (ver validación abajo), pero no hay un ejemplo visible en la app con
  datos de ejemplo. Se activará sola en cuanto un negocio real no tenga nada más que mostrar.

### 3. Publicidad conectada de verdad

La tabla `anuncios` ya existía en la base de datos desde hace tiempo (migración
`0008_publicidad_novedades.sql`, preparada de antemano) pero nunca tuvo un módulo de servidor
detrás. Se construyó el módulo `publicidad` completo:

- **Backend**: `GET /anuncios` (público — solo devuelve los activos y vigentes por fecha, que es
  justo lo que la app necesita mostrar) y `GET /anuncios/admin` (super_admin, todos sin filtrar,
  para que el panel pueda ver programados/vencidos/pausados). `POST/PATCH/DELETE /anuncios` y
  `POST /anuncios/:id/foto` para el CRUD completo del panel.
- **Panel admin**: `useAnuncios.ts` pasó de guardar todo en memoria a llamar la API real; se
  habilitó el botón "Subir imagen" del modal (antes deshabilitado a propósito, con el aviso
  "todavía no está conectada") — solo se puede subir la foto de un anuncio que ya se guardó
  (mismo patrón que Servicios: hace falta un id primero). Los paneles de vista previa ("¿Dónde se
  ve esto?") ahora muestran la foto real en vez de un bloque de color o un ícono de estrella.
- **App móvil**: se armó el repositorio completo (`contratos/repositorioAnuncios.ts` +
  mock/api/hook, mismo patrón que el resto del proyecto). `CarruselPublicidad.tsx` (Inicio) y el
  banner de `buscar.tsx` (que ya existía visualmente pero estaba **mal conectado** — leía
  siempre el último ítem del archivo de ejemplo sin importar su ubicación ni si tenía foto) ahora
  filtran por `ubicaciones` de verdad y muestran la foto real. De paso, tocar cualquiera de los
  dos anuncios ahora navega a la ficha del negocio vinculado si tiene uno — antes no hacía nada.

## Errores encontrados en el camino

- **`ubicaciones::text[]` sin castear**: el driver de Postgres (`pg`) no tiene registrado un
  parser de array para el tipo enum `ubicacion_anuncio[]` (solo conoce los arrays de tipos
  nativos) — sin el cast explícito a `text[]` en la consulta, cada fila llegaba como el string
  literal de Postgres (`"{carrusel_inicio}"`) en vez de un array de JS, y el filtro
  `.includes(...)` del lado de la app nunca hacía match.
- **Corrupción de codificación UTF-8 al probar por consola**: una prueba de `curl` en PowerShell/
  Git Bash con un guion largo ("—") y una tilde en el cuerpo del PATCH terminó guardando
  "20% en parrillas � El Fog�n" en la base de datos — un problema conocido de este entorno
  Windows con caracteres no-ASCII en argumentos de línea de comandos (la misma razón por la que
  las migraciones siempre se aplican con `psql < archivo.sql`, nunca `-c`). Se detectó al ver el
  texto mal codificado en el panel y se corrigió con el mismo mecanismo (`psql < archivo.sql`).

## Validado en vivo

**Backend** (`curl`, con limpieza de datos de prueba después de cada verificación): subida y
reemplazo de foto de producto, agregar y borrar foto de galería (respetando el límite de 6),
CRUD completo de anuncios (crear/PATCH parcial/activar-pausar/eliminar/subir foto),
`GET /anuncios` filtrando correctamente por activo+vigencia mientras `GET /anuncios/admin`
devuelve las 3 filas de ejemplo sin filtrar (incluida la programada a futuro).

**App móvil**: el menú de Panadería Los Rosales y el catálogo de Tejidos Andinos SB muestran las
fotos reales de cada plato/producto. El carrusel de Inicio y el banner de Buscar muestran las
fotos de los anuncios de ejemplo y navegan al negocio correcto al tocarlos.

**Panel admin**: "Mi negocio → Fotos" (como María, dueña de El Fogón) muestra los 4 productos del
restaurante con su selector de foto, y la sección de galería lista para agregar. "Publicidad"
(como super-admin) carga los 3 anuncios reales desde el servidor, con sus contadores correctos
(3 registrados, 2 activos, 1 programado); se probó pausar y reactivar un anuncio en vivo, y el
modal de edición abre con los datos reales y el botón de subir imagen habilitado.

## Adenda — rediseño de las 2 tarjetas de publicidad (mismo día)

El usuario pidió mejorar el diseño de las tarjetas de `CarruselPublicidad` (Inicio) y del banner
de `buscar.tsx`, viéndolas ya con datos reales — el formato "ícono chico + fila de texto" se
sentía plano y el nombre se cortaba mal ("Superme..."). Se le presentó un bosquejo (HTML, sin
tocar código) con 2-3 alternativas antes de aplicar nada, y eligió:

- **Carrusel de Inicio**: la tarjeta pasó del mismo patrón "ícono + texto" al lenguaje ya
  establecido en las tarjetas de Servicios — `ImageBackground` + `LinearGradient` (foto entera
  arriba, oscurecido concentrado abajo) con el nombre y detalle en blanco, y un chip "Ver"
  (coral, `colores.acentoFuerte`) abajo a la derecha solo si el anuncio tiene negocio vinculado.
- **Banner de Buscar**: pasó de una barra oscura fija a un fondo verde suave
  (`colores.primarioSuave`, se adapta solo en modo oscuro), con una miniatura más grande y un
  chip "Ver" en verde de marca (`colores.primario`).

Se descartó a propósito una etiqueta "Publicidad" visible en la tarjeta — el usuario la pidió
quitar en ambos diseños.

**Bug encontrado al aplicar**: el chip "Ver" se veía con el texto partido en 3 líneas verticales
("V" / "e" / "r") en vez de una — un contenedor flex hijo sin `minWidth: 0` dentro de una fila
`flex: 1` fuerza a los hermanos (el chip) a comprimirse a un ancho casi nulo en React Native Web,
aunque tengan `flexShrink: 0` puesto de forma aislada. Se corrigió agregando `minWidth: 0` al
bloque de texto que sí debe achicarse, dejando al chip su ancho de contenido real.

