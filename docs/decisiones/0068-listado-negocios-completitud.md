# 0068 — Listado de negocios con "qué le falta a esta ficha"

Fase 5 (última) del rediseño del módulo de negocios. Las anteriores:
[0065](0065-crud-productos-moneda-coordenada.md) productos y moneda,
[0066](0066-edicion-sin-validacion.md) edición sin validación,
[0067](0067-ficha-negocio-panel.md) la ficha completa en el panel.

## Contexto

Las fases 1 a 4 dieron el lugar donde **llenar** una ficha (información, horario, fotos, ofertas,
productos, dueño). Quedaba el otro lado del pedido original: *"mejora cómo se tiene organizado
actualmente la visualización de los negocios"*.

El listado tenía dos problemas concretos:

1. La miniatura era un emoji `🖼️` fijo. Todos los negocios se veían igual aunque tuvieran foto.
2. No había forma de saber a cuáles les faltaba algo sin entrar uno por uno. Con 15 negocios ya
   costaba; con 200 en varios distritos es imposible.

## Decisión: la completitud se ve en la fila

Cada fila muestra ahora cinco marcas — 📷 foto, 🕒 horario, 📝 descripción, 🏷️ categoría,
👤 dueño — y, al lado, el resumen en castellano: *"Falta foto, horario y dueño"* o
*"Ficha completa"*.

Las marcas pendientes se ven **apagadas en gris, no en rojo**: una ficha a medias es trabajo por
hacer, no un error que alguien cometió. El texto es lo que de verdad se lee de un vistazo; los
íconos son el detalle al pasar el mouse.

El cálculo vive en `apps/admin/src/utilidades/completitudNegocio.ts`, para que cualquier otra
pantalla pueda usar el mismo criterio.

**Los productos no cuentan.** No todo negocio tiene carta — una lavandería, una inmobiliaria y una
consultoría están completas sin un solo producto. Exigirlos marcaría como incompletas fichas que
ya están terminadas.

El dueño se deduce de las cuentas con rol `dueno_negocio` y su `negocioIds`, igual que la pestaña
"Dueño" de la ficha: el negocio no guarda a quién pertenece, la cuenta guarda qué administra.

## Filtro y tarjeta de resumen

- Chip **"📝 Solo incompletos"**, que se combina con los filtros de estado y categoría.
- La cuarta tarjeta de resumen pasó de **"% verificados"** a **"Fichas incompletas"**. El
  porcentaje era informativo pero no decía qué hacer con él; el número de fichas a medias sí, y
  además es exactamente lo que filtra el chip nuevo.

## De paso: las fotos absolutas ya no se rompen

Al poner la foto real en la fila apareció un bug viejo. `urlCompleta()` existía en
`apps/admin/src/utilidades/media.ts` desde las categorías, pero **nadie la usaba**: los `<img>`
armaban la URL a mano con `` `${entorno.origenApi}${ruta}` ``. Eso funciona con las fotos subidas
al propio servidor (`/uploads/...`) y rompe las absolutas — los negocios de ejemplo apuntan a
Unsplash, y salía `http://localhost:3000https://images.unsplash.com/...`.

Los 15 `<img>` del panel (negocios, ficha, productos, servicios, publicidad) pasan ahora por
`urlCompleta()`.
