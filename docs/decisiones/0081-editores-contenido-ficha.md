# 0081 — Editores de servicios, rubros y pasillos, y limpieza de arquetipos

## Contexto

Tres fichas (ver 0080) muestran contenido que no son productos: **Servicios y tarifas**
(`negocios.servicios_ofrecidos`), **Rubros** (`rubros_disponibles`) y los **pasillos** de
**Ofertas y pasillos** (`pasillos`). No había forma de cargarlos desde el panel: solo por la base.

## Decisión

- API (`negocios.controller.ts`):
  - `PUT :id/servicios` reemplaza la lista completa `{ servicios: [{ nombre, detalle?, precio, fotoUrl? }] }`.
    Borra del almacenamiento las fotos que la lista deja de usar y solo acepta fotos de nuestro
    propio almacenamiento (o las que ya tenía).
  - `POST :id/servicios/foto` sube la foto de un servicio y devuelve `{ url }`, que se guarda con
    la lista. Una foto subida y nunca guardada queda huérfana en el almacenamiento (igual que al
    cancelar otros formularios); es poco volumen.
  - `PUT :id/rubros` y `PUT :id/pasillos` con `{ items: string[] }` (sin repetidos, en orden).
  - Permisos como productos: super_admin, gestor_negocios y el dueño del negocio.
- Panel: pestañas **Servicios y tarifas**, **Rubros** y **Pasillos** en la ficha del negocio
  (admin) y en "Mi negocio" (dueño). Solo aparecen si la ficha del negocio las usa, o si el
  negocio ya tiene esos datos. Cada editor tiene al costado el mismo celular de vista previa del
  módulo Fichas, que se actualiza mientras se edita.
- Migración 0029: se borran la tabla `arquetipos`, `plantillas_visuales`, las columnas
  `categorias.arquetipo_ficha` / `arquetipo_id` y sus tipos. La semilla (`generar-semilla.js`)
  ya no las crea: cada categoría lleva su `ficha`.
