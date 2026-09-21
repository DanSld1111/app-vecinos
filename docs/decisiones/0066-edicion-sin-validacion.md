# 0066 — Editar un negocio ya no pasa por validación

## Contexto

Al probar la Fase 1 contra el servidor real (ver
[decisión 0065](0065-crud-productos-moneda-coordenada.md)) apareció este comportamiento: editar
la información de un negocio cambiando **una** categoría a uno que tenía **dos** lo devolvió a
`por_verificar` y, como `obtenerPorId()` filtra por `estado = 'activo'`, **el negocio desapareció
de la app pública** hasta volver a aprobarlo.

No era un bug: `actualizarInfo()` trataba nombre, dirección y categorías como "cambio sensible" y
los mandaba a revisión a propósito. Pero el efecto práctico era que corregirle una tilde al
nombre bajaba la ficha de la app sin avisarle a nadie — incluso cuando quien editaba era el
propio super_admin, que es justamente quien aprueba.

## Decisión

**Ni el dueño ni el admin pasan por validación al editar.** Cualquier cambio en cualquier parte
de un negocio se refleja en la app de inmediato.

El estado del negocio ya no se toca al guardar: si estaba activo, sigue activo; si estaba en
`por_verificar` (recién creado), sigue ahí hasta que se publique.

## Qué NO cambia

- **Los negocios recién creados siguen naciendo en `por_verificar`.** Eso no es "validar una
  edición", es no publicar una ficha a medio llenar en el momento en que se escribe el nombre: se
  completa y después se publica. La cola de validación y la línea de tiempo del estado siguen
  teniendo sentido para ese caso.
- **Los avisos de junta vecinal siguen pasando por validación.** Son contenido de comunicación
  dirigido a todo el distrito, no la ficha de un negocio; ese flujo queda igual.

## Cambios

- `negocios.service.ts::actualizarInfo()` — se quitó por completo el cálculo de `cambioSensible`
  y su efecto sobre `estado`/`motivo_rechazo`. Se agregó registro de auditoría de la edición, que
  antes no existía.
- El índice de búsqueda se sigue sincronizando después de editar (el nombre o la dirección
  nuevos tienen que reflejarse ahí aunque el estado no cambie).
- Textos actualizados en los dos lugares que le prometían al dueño lo contrario:
  `apps/admin/src/paginas/MiNegocio.tsx` y
  `apps/movil/src/componentes/gestion/PantallaMiNegocio.tsx` — ahora dicen que los cambios se
  ven en la app de inmediato.
