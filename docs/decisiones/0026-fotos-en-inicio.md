# 0026 — Fotos en toda la pantalla de Inicio

## Contexto

Pedido del usuario: "en mi app en inicio también le podrías colocar imágenes a todo, quiero
ver cómo queda con imágenes, búscalas de internet y colócalas". Después de ver las 4 tarjetas de
Servicios con foto ([decisión 0025](0025-servicios-editables-desde-admin.md)), quiso el mismo
tratamiento en Inicio, donde varios espacios ya estaban preparados para mostrar una foto pero la
usaban poco o nada:

- Los 9 negocios de ejemplo (ver [avance del proyecto](../cliente/04-avance-del-proyecto.md))
  tenían `fotoPrincipalUrl: null` desde que se cargaron — así que la tarjeta destacada grande, el
  riel de mini-negocios y la lista de "Negocios cerca de ti" siempre mostraban el reemplazo
  genérico (ícono o iniciales), nunca una foto real.
- El riel de mini-negocios (`RielMiniNegocios.tsx`) ni siquiera miraba `fotoPrincipalUrl` —
  mostraba iniciales sí o sí, a diferencia de `TarjetaNegocio` y `TarjetaDestacadoGrande` que ya
  sabían mostrar la foto si existía.
- El carrusel de publicidad (`CarruselPublicidad.tsx`) mostraba un cuadro de color liso en vez de
  una imagen — nunca tuvo la capacidad de mostrar una foto real.

## Decisión

**Origen de las fotos**: igual que en la decisión 0024, fotos libres de Unsplash (licencia
Unsplash, uso comercial permitido, sin atribución obligatoria), buscadas y revisadas una por una
para descartar cualquiera con texto legible, marca de un producto, o marcador de un país
específico (se rechazaron explícitamente: una etiqueta de pintura con marca visible, un puesto de
ferretería japonés con texto en japonés, una llave inglesa con "USA" grabado, una vitrina de
cupcakes con letreros de precio en inglés, un estante de supermercado con marcas
estadounidenses).

Como estos son los 9 **negocios de ejemplo** (ficticios, para poder mostrar la app sin datos
reales — ver el aviso correspondiente en el avance del proyecto), se usó el mismo criterio que en
la decisión 0024: fotos genéricas que representan el rubro del negocio (una panadería, una
veterinaria, una ferretería, etc.), no una foto que pretenda ser el local real de "Panadería Los
Rosales" — ese local no existe.

| Negocio de ejemplo | Foto |
|---|---|
| Panadería Los Rosales | Panes artesanales recién horneados |
| Veterinaria Aviación | Perro (mascota) |
| Ferretería Limatambo | Llaves de mecánico en círculo |
| Lavandería La Rinconada | Chompas dobladas y limpias |
| El Fogón Sanborjino | Carne a la parrilla |
| Supermercado San Borja | Verduras frescas de colores |
| Postres Doña Herminia | Torta decorada |
| Tejidos Andinos SB | Manos tejiendo a mano |
| Boutique El Jardín | Percha de ropa en tienda |

A diferencia de la decisión 0024 (fotos locales empaquetadas con la app, recortadas a mano), acá
se referenció directamente la URL de Unsplash (`fotoPrincipalUrl` como URL absoluta
`https://images.unsplash.com/...`) en vez de descargar y recortar cada imagen — es más rápido y
razonable para datos de ejemplo (no para assets que se envían con la app). `urlCompleta()`
(`apps/movil/src/utilidades/media.ts`) ya devolvía cualquier URL absoluta sin modificarla, así que
no hizo falta tocarla.

**Implementación**:
- `apps/movil/src/datos/mock/negocios.mock.ts`: los 9 negocios de ejemplo pasaron de
  `fotoPrincipalUrl: null` a la URL de Unsplash correspondiente a su rubro.
- `apps/movil/src/componentes/RielMiniNegocios.tsx`: ahora muestra la foto del negocio si existe
  (como ya hacían `TarjetaNegocio` y `TarjetaDestacadoGrande`), con el mismo reemplazo de
  iniciales (`AvatarNegocio`) si no hay foto.
- `apps/movil/src/datos/mock/anuncios.mock.ts` y `CarruselPublicidad.tsx`: se agregó el campo
  opcional `imagenUrl` a `Anuncio` — si existe, se muestra esa foto en vez del cuadro de color
  liso. Los 3 anuncios de ejemplo reusan la misma foto que su negocio correspondiente (mismo
  nombre, misma foto), para que se vea consistente.

**Qué se dejó igual, a propósito**: los íconos de categoría (`TarjetaCategoria.tsx`) siguen
siendo íconos pequeños sobre una insignia de color, no fotos — son demasiado chicos (50-58px) para
que una foto se vea bien ahí, y ese patrón de insignia-con-ícono es consistente con cómo se ven
las categorías en el resto de la app (buscador, ficha de negocio).

## Validado en vivo

Recorrida la pantalla de Inicio completa en el navegador, en modo claro y oscuro: el carrusel de
publicidad, la tarjeta destacada grande, el riel de mini-negocios y la lista de "Negocios cerca de
ti" muestran sus fotos correctamente. Se abrió la ficha de "Veterinaria Aviación" y se confirmó
que la misma foto aparece como foto principal de la ficha (comparte el mismo campo
`fotoPrincipalUrl`).
