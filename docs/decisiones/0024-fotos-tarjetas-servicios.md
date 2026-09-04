# 0024 — Fotos de fondo en las tarjetas de Servicios

## Contexto

Pedido del usuario: las 4 tarjetas de "Disponible ahora" en Servicios (Guía de negocios,
Restaurantes, Market Space, Supermarket) se veían planas — un ícono pequeño sobre un cuadro de
color liso. Pidió una foto de fondo que ocupe toda la tarjeta.

## Decisión

**Origen de las fotos**: no hay `GEMINI_API_KEY` configurada en este entorno para generarlas con
IA, así que —a pedido explícito del usuario— se buscaron fotos libres en Unsplash (licencia
Unsplash: uso comercial permitido, sin atribución obligatoria). Se descartaron varias por mostrar
letreros o elementos muy marcados de un país específico (un pueblo de Texas, un escudo real de
Marruecos, un mural con texto en inglés) — no encajan con una app de San Borja, Lima. Las 4
elegidas son genéricas: no muestran texto legible, banderas, ni marcas de un negocio real.
Créditos (Unsplash License, sin atribución obligatoria, documentado igual por transparencia):

| Categoría | Foto | Fotógrafo |
|---|---|---|
| Guía de negocios | Puertas roja y amarilla sobre ladrillo | Robert Anasch |
| Restaurantes | Plato de burrata y tomates | Taylor Heery |
| Market Space | Vasijas de cerámica artesanal | Chloe Bolton |
| Supermarket | Tomates de colores en cajón | Serghey Savchuk |

Cada foto se recortó a mano (`PIL`/Pillow) para encuadrar bien el sujeto principal dentro de la
proporción real de la tarjeta (≈16:10) y, en el caso de "Guía de negocios", para eliminar un
letrero comercial legible que sí aparecía en el encuadre original.

**Implementación** (`apps/movil/app/(tabs)/servicios/index.tsx`): cada tarjeta pasó de
`View` con color de fondo a `ImageBackground` (imagen local en `assets/servicios/`) con un
degradado encima (`expo-linear-gradient`, nueva dependencia) que solo oscurece el tercio
inferior — donde va el nombre y la descripción en blanco — dejando el resto de la foto visible.
El ícono de cada categoría se mantiene en una insignia blanca flotante, con su color distintivo
de antes (azul/coral/oro/verde), para que las tarjetas se sigan diferenciando de un vistazo
incluso si dos fotos tuvieran tonos parecidos.

**Bug real encontrado en el camino**: en la primera versión, `ImageBackground` en React Native
Web renderizaba su `<img>` interno al tamaño NATURAL de la imagen en vez de estirarlo a la
tarjeta (confirmado inspeccionando el DOM: `clientWidth`/`clientHeight` == `naturalWidth`/
`naturalHeight`) — el resultado visual era una porción arbitraria y sin escalar de la foto
original, recortada donde caía. Se corrigió agregando `width: "100%", height: "100%"` explícito
al `imageStyle` de `ImageBackground` (antes solo tenía `borderRadius`) y `resizeMode="cover"`
explícito.

## Validado en vivo

Recorridas las 4 tarjetas en el navegador, en modo claro y oscuro: cada foto llena la tarjeta
completa, el degradado deja el nombre/descripción legibles sobre cualquier foto, los íconos
distintivos se conservan, y tocar una tarjeta sigue navegando a la pantalla correcta (probado
con Market Space → Guía de productos).

## Pendiente explícito

El usuario pidió que, una vez lista esta versión rápida (fotos fijas en el código), se construya
la versión editable desde el panel admin: una tabla en la base de datos por servicio, un
endpoint para subir/reemplazar la foto (reutilizando el mecanismo de subida de fotos de negocio,
ver [decisión 0021](0021-endurecimiento-post-diagnostico.md)), una sección nueva en el panel, y
que la app pida estas fotos al servidor en vez de traerlas fijas en el código. No implementado
todavía — es la siguiente tarea.
