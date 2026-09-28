# 0079 — Antes y después de un aviso reenviado

**Fecha:** 2026-09-28 · **Estado:** en producción

## Contexto

La cola de validación mostraba solo el contenido actual. Se pidió un "antes y después", pero desde
la decisión 0066 editar un negocio ya no pasa por validación: la cola de negocios solo recibe
altas nuevas, que no tienen versión anterior. El único caso real con un "antes" es un **aviso de
junta vecinal rechazado que se corrige y se reenvía** (`PATCH /avisos/:id/reenviar`).

## Decisión

- Migración `0027_aviso_version_rechazada.sql`: columna `avisos.version_rechazada jsonb` (nullable).
- Al reenviar, el `UPDATE` guarda en esa columna el título, cuerpo, categoría y motivo de rechazo
  tal como estaban (en el `SET` de Postgres el lado derecho ve los valores anteriores). Al aprobar
  se limpia; si se vuelve a rechazar y reenviar, se sobrescribe con la última versión rechazada.
- `Aviso.versionRechazada` en `@app-vecinos/tipos`.
- Panel, cola de validación: si el aviso trae `versionRechazada`, se muestra una tabla
  Rechazado / Reenviado con el motivo arriba y los campos que cambiaron resaltados.

## Qué no se hizo

- Antes y después para negocios: requeriría volver a mandar las ediciones a validación
  (deshacer 0066). Se descartó a pedido del usuario.

## Cómo se aplicó

La migración se aplicó a la base de producción **antes** de desplegar la API, porque
`SELECT_AVISO` ya lee la columna nueva.
