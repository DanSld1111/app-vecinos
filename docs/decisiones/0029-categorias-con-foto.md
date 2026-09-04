# 0029 — Las categorías de Inicio pasan de ícono a foto

## Contexto

Revisando cómo se ven las tarjetas de categoría de Inicio (íconos de líneas, todas del mismo
tamaño), el usuario pidió explorar un diseño con foto en vez de ícono — inspirado en cómo otra
app de delivery usa fotos reales para sus categorías. Se le presentaron bocetos (HTML, sin tocar
código) antes de decidir, y confirmó: la foto **reemplaza** al ícono (no conviven ambos), y debe
poder cambiarse desde el panel admin — igual que ya pasa con Servicios, negocios y productos.

## Decisión

**Modelo de datos**: se agregó `foto_url TEXT` a la tabla `categorias` (migración
`0013_foto_categoria.sql`) y `fotoUrl: string | null` al tipo `Categoria`. El campo `icono`
**no se eliminó** — se mantiene en la base de datos y en el formulario del panel como "ícono de
respaldo": si una categoría nueva se crea sin foto todavía, la app sigue mostrando algo (nunca un
espacio vacío) hasta que alguien le suba una. En la práctica, hoy las 14 categorías ya tienen una
foto real, así que el ícono no se ve en ningún lado de la app — pero sigue ahí como red de
seguridad, igual que el resto de "sin foto" de la app (`SinFoto`, `AvatarNegocio`).

**Origen de las fotos**: mismo criterio que en las decisiones 0024, 0026 y 0028 — fotos libres de
Unsplash, genéricas del rubro (nunca la foto de un negocio real específico), revisadas una por
una para descartar texto legible, marca o marcador de un país. Se rechazaron en el camino: un
pasaporte con "ESPAÑA" visible (Turismo), dos casas de estilo residencial estadounidense muy
marcado (Inmobiliaria), y una maleta de herramientas con marca de fábrica visible (Servicios).

| Categoría | Foto |
|---|---|
| Comida | Pan artesanal (misma foto que usa el servicio "Guía de negocios") |
| Salud | Persona con estetoscopio |
| Hogar | Llaves de mecánico (misma foto que Ferretería Limatambo) |
| Moda | Percha de ropa en tienda (misma foto que Boutique El Jardín) |
| Servicios | Técnico trabajando con herramientas |
| Mascotas | Perro (misma foto que Veterinaria Aviación) |
| Restaurantes | Carne a la parrilla (misma foto que El Fogón / el servicio "Restaurantes") |
| Supermercados | Verduras de colores (misma foto que Supermercado San Borja / el servicio "Supermarket") |
| Emprendimientos | Manos tejiendo a mano (misma foto que Tejidos Andinos SB) |
| Rescate animal | Gato en un refugio |
| Turismo | Mapa, pasaporte y cámara (flatlay de viaje) |
| Inmobiliaria | Edificio de departamentos genérico |
| Consultorías | Reunión de trabajo con laptops |
| Otros servicios | Manos juntas (comunidad/trabajo en equipo) |

Varias categorías reusan la misma foto que ya tenía su negocio de ejemplo o su servicio
correspondiente (Comida/Restaurantes/Supermercados/Hogar/Moda/Mascotas/Emprendimientos) — mismo
criterio visual, una sola foto por concepto en vez de buscar una distinta para cada pantalla.

**Backend**: el módulo `categorias` no tenía ni `crear` ni `actualizar` — solo `listar()`. Se
construyeron desde cero: `POST /categorias` (crear), `PATCH /categorias/:id` (actualizar
nombre/ícono/arquetipo), `POST /categorias/:id/foto` (subir/reemplazar foto, mismo mecanismo de
disco que negocios/servicios/anuncios) — los tres solo para `super_admin`.

**Panel admin**: la página "Categorías" tampoco estaba conectada al servidor — el botón "Nueva
categoría" solo guardaba en memoria del navegador, y no existía forma de editar una categoría ya
creada. Se conectó `useCategorias` a la API real y se agregó edición completa: tocar cualquier
tarjeta abre el mismo modal de creación, ya con sus datos, más un selector de foto ("Cambiar
foto" si ya tiene una, "Subir foto" si no). Como esta lista se usa desde 8 pantallas distintas del
panel (Mi negocio, Categorías, el selector de negocio, etc.) y antes se cargaba sola desde un
mock al importar el store, se agregó una carga inicial en `LayoutAdmin.tsx` (mismo lugar donde ya
se cargaba el contador de pendientes) para que esté disponible desde el ingreso, sin depender de
que alguien visite `/categorias` primero.

**Bug encontrado al aplicar**: las fotos de categoría no cargaban en el panel — salían rotas. La
página anteponía el origen de la API a cualquier `fotoUrl` (`${entorno.origenApi}${fotoUrl}`),
asumiendo que siempre es una ruta relativa propia (`/uploads/...`), como pasa con negocios,
servicios y anuncios. Categorías es la primera entidad cuya foto puede venir como una URL
absoluta de verdad (las 14 de ejemplo apuntan a Unsplash) — se corrigió agregando
`apps/admin/src/utilidades/media.ts`, igual al `urlCompleta()` que ya existía en la app móvil.

## Validado en vivo

Confirmado en la app móvil, en claro y oscuro: las 14 tarjetas de Categorías muestran su foto
real en vez del ícono de líneas. En el panel: la lista de Categorías carga las 14 desde el
servidor real (antes de mock), y el modal de "Editar" abre con la foto, el nombre y el arquetipo
correctos para "Comida".
