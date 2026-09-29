# 0082 — Celular de vista previa al registrar y editar un negocio

## Contexto

Cada pestaña de edición de un negocio tenía su propia miniatura de teléfono con un pedazo de la
ficha (solo la foto, solo el horario…), y el registro no tenía ninguna. No se veía el apartado
completo del negocio en la app hasta guardar y abrir la app.

## Decisión

- `VistaPreviaNegocio` (`apps/admin/src/componentes/fichas/`): el apartado completo, como en la
  app — portada, nombre, calificación, abierto/cerrado, descripción, botones de contacto,
  contenido de su ficha (decisión 0080), ubicación, horario y "Acerca del negocio" — más la vista
  "En el listado" (su tarjeta en Inicio).
- Edición (ficha del panel y "Mi negocio"): `ConVistaPrevia` pone ese celular fijo al costado en
  todas las pestañas. Cada pestaña publica lo que se está escribiendo en `useBorradorNegocio`
  (`usePublicarBorrador`) y el celular lo combina con lo guardado; avisa "Con cambios sin
  guardar". Al salir de una pestaña sin guardar, su borrador se retira (igual que el formulario).
  Cada pestaña indica qué parte mira (`useEnfoqueVistaPrevia`) y el celular se desplaza hasta ahí.
- Registro: el celular arma el negocio con lo escrito en cada paso (y el primer producto, con su
  foto local antes de subirla).
- Se quitaron las miniaturas viejas de cada pestaña.
