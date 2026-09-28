# 0080 — Fichas: una sola capa en vez de Plantillas y Arquetipos

## Contexto

La ficha de un negocio en la app se decidía con tres capas: **Plantillas visuales** (15 diseños
en el panel), **Arquetipos** (elegían una plantilla y renombraban sus campos) y la **categoría**
(apuntaba a un arquetipo). En la práctica la app móvil solo sabía dibujar 6 fichas y las tomaba
de un campo viejo de la categoría (`arquetipo_ficha`), así que:

- un arquetipo nuevo creado en el panel no cambiaba nada en la app;
- una categoría nueva creada en el panel no tenía `arquetipo_ficha` y caía siempre en la galería;
- los campos extra de los productos (`atributos_producto`) solo se podían cambiar en la base.

## Decisión

- **Ficha** (`TipoFicha` en `paquetes/tipos/src/ficha.ts`): menu, catalogo, servicios, rubros,
  ofertas, galeria. Son exactamente los diseños que la app dibuja.
- **Servicio → ficha por defecto** (`servicios_app.ficha`). null = no es un directorio de
  negocios (Taxi, Bolsa de empleo…).
- **Categoría → hereda o elige otra** (`categorias.ficha`, null = hereda). Además puede poner un
  título propio a la sección (`categorias.titulo_seccion`) y editar sus campos extra desde el
  panel (`atributos_producto`, con `oculto` para dejar de pedir y mostrar un campo sin perder los
  valores ya cargados). La clave de un campo no cambia al renombrarlo: es lo que queda guardado
  en cada producto.
- La API resuelve la herencia y devuelve `fichaEfectiva` (propia → la del servicio → galería).
  Sigue enviando `arquetipoFicha`, calculado desde la ficha efectiva, solo para versiones viejas
  de la app.
- Panel: Plantillas y Arquetipos se reemplazan por **Fichas** (catálogo y dónde se usa cada una).
  Servicios y Categorías eligen la ficha con un **celular de vista previa** al costado que muestra
  la ficha con un negocio real de esa categoría mientras se configura
  (`apps/admin/src/componentes/fichas/`).
- Se quitó el módulo `arquetipos` de la API. La tabla `arquetipos` y las columnas
  `categorias.arquetipo_ficha` / `arquetipo_id` quedan sin uso (migración 0028 solo agrega); se
  pueden borrar más adelante.

## Qué requiere código

- Categoría nueva: nada, hereda la ficha de su servicio.
- Servicio nuevo: la pantalla del servicio en la app (como hasta ahora); su ficha se elige en el
  panel.
- Ficha nueva (un diseño que no existe, ej. reservas por hora): agregarla a `TipoFicha`/`FICHAS`,
  al CHECK de la migración, a la ficha del negocio en la app y a `TelefonoFicha` del panel.
