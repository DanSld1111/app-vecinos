# 0084 — Alertas emergentes y qué le falta a la ficha de un negocio

## Contexto

- El listado de negocios mostraba "4/5" sin decir qué faltaba (solo en un texto al pasar el mouse).
- Las confirmaciones eran una etiqueta chica abajo a la derecha, y varias acciones no avisaban
  nada (guardar el horario, por ejemplo).

## Decisión

- **Qué falta** (`utilidades/completitudNegocio.ts`, cada parte sabe en qué pestaña se completa):
  chips "Falta: Horario, Dueño…" en cada tarjeta del listado que llevan a esa pestaña; en la ficha
  del negocio (admin y "Mi negocio"), una franja "A la ficha le falta 1 de 5" con un botón para
  completarlo y un punto en las pestañas pendientes; alerta "¡Ficha completa!" al terminar. Se
  siguen contando 5 partes (foto, horario, descripción, categoría, dueño).
- **Alertas** (`estado/useToasts.ts`, `componentes/PilaToasts.tsx`): arriba al centro, con rebote;
  éxito con ✓ que se dibuja y cierre a los 4 s (pausa con el mouse); error que tiembla, no se
  cierra solo y ofrece "Reintentar"; info en azul. Título (qué se hizo) + detalle (dónde).
- **Todas las acciones avisan**: `estado/alertasDeAcciones.ts` envuelve una sola vez las acciones
  de los stores (negocios, categorías, servicios, cuentas, vecinos, avisos, publicidad, novedades,
  territorio) con su título y detalle; el motivo del error sale del campo `error` del store.
  Productos (que usan la API directa) avisan desde su pantalla.
