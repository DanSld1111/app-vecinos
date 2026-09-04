# 0037 — Desactivar/eliminar distritos y comunidades

## Contexto

El usuario notó que, tras la conexión real de Distritos (0034), el panel solo permitía
**activar** un distrito y crear comunidades — no había forma de apagar un distrito ni de
desactivar o eliminar una comunidad. Faltaba el camino de vuelta.

## Decisión

**Distritos** — nunca se borran (son filas del catálogo UBIGEO real, no datos que el admin creó):
se agregó `PATCH /distritos/:ubigeo/desactivar`, que exige que el distrito ya no tenga ninguna
comunidad activa (si tiene, 409 pidiendo desactivarlas primero) — evita dejar una comunidad
visible en la app colgando de un distrito apagado.

**Comunidades** — sí son datos reales creados por el admin, así que además de desactivar
(`PATCH /comunidades/:id/desactivar` / `/activar`, oculta o vuelve a mostrar en `GET
/comunidades`) se agregó `DELETE /comunidades/:id` para borrarla de verdad. Mismo criterio que
`arquetipos` (0034/decisión de arquetipos): no hace falta chequear "a mano" si tiene negocios,
avisos o vecinos — la propia FK de la base (`negocios.comunidad_id`, `avisos.comunidad_id`,
`usuarios_app.comunidad_id`, sin `ON DELETE CASCADE`) lo impide, y el error se traduce a un 409
legible en vez de un 500 crudo.

En `Distritos.tsx`: cada comunidad tiene ahora "Activar"/"Desactivar" y 🗑️ (con modal de
confirmación); un distrito sin ninguna comunidad activa muestra "Apagar distrito X" (confirmación
en línea, mismo patrón que "Agregar comunidad").

## Bug encontrado y corregido en la verificación

`desactivarDistrito` en el store dejaba el distrito apagado *dentro* del array `distritos` en
vez de sacarlo — como ese array representa "los activos" (mismo shape que `GET /distritos`),
seguía apareciendo en la lista y en el contador "Distritos activos" del Dashboard después de
apagarlo. Corregido: ahora se filtra fuera del array al desactivar, igual que ya hacía
`eliminarComunidad`.

## Corrección post-publicación: los distritos apagados desaparecían del panel

El usuario reportó, después de usar esta función, que al apagar 2 distritos "se han eliminado, ya
no me aparecen" — alarma legítima de pérdida de datos. Se verificó en la base: nada se había
borrado (`distritos.activo = false`, filas intactas) — el problema era que `GET /distritos`
(admin) solo devolvía los activos, así que un distrito apagado directamente dejaba de listarse en
el panel, sin ninguna forma de volver a encenderlo salvo re-buscarlo desde cero en el catálogo
completo de 1892 distritos.

Se corrigió la consulta para que devuelva los distritos activos **más los que tienen alguna
comunidad** (activa o no) — es decir, "todo lo que el panel gestiona", no solo lo prendido en
este momento. `Distritos.tsx` ahora muestra un distrito apagado con badge "Inactivo" y un botón
"Activar distrito" directo en su tarjeta, sin pasar por el buscador. Se restauraron los 4
distritos y sus 4 comunidades del piloto a su estado activo original.

## Pestañas Activos/Inactivos

A partir del arreglo anterior, la lista ya mezclaba activos e inactivos sin distinción visual
más que el badge — pedido natural del usuario: separar en dos pestañas ("Activos" e "Inactivos",
con su contador cada una), **Activos** por defecto al entrar. Al apagar un distrito, la vista
salta sola a la pestaña Inactivos (y al reactivarlo, salta de vuelta a Activos) — así el cambio
de estado siempre queda a la vista, en vez de tener que adivinar a qué pestaña se fue.

## Validado en vivo

Se desactivó la comunidad de Miraflores → apareció la opción "Apagar distrito Miraflores" →
se apagó → desapareció de la lista de distritos activos y del contador del Dashboard → se
reactivó todo por API para no alterar los datos piloto. Se probó eliminar la comunidad de
Miraflores (que sí tiene un negocio y un aviso reales): la base lo bloqueó con el mensaje
esperado, sin borrar nada.
