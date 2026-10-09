# 0087 — Archivar o eliminar un negocio desactiva sus anuncios

## Contexto

Al archivar los 30 negocios activos (2026-10-09) quedó vigente en la app el anuncio "Torta por
encargo — Doña Herminia", que llevaba a un negocio archivado. Al eliminar un negocio pasaba algo
parecido: el anuncio quedaba activo con `negocio_id = NULL` (migración 0018).

## Decisión

- `NegociosService.archivar` y `eliminar` desactivan (`activo = false`, no borran) los anuncios
  activos del negocio, con una entrada de auditoría `desactivar / anuncio` por cada uno
  (`detalle.motivo` = `archivar` | `eliminar`, `detalle.negocioId`). En `eliminar` se hace antes
  del DELETE, mientras todavía se sabe a qué negocio pertenecían.
- Restaurar un negocio archivado **no** reactiva sus anuncios: se revisan y reactivan a mano en
  Publicidad, porque sus fechas o su texto pueden haber quedado viejos.
- El panel lo avisa en la confirmación de Archivar y de Eliminar.
