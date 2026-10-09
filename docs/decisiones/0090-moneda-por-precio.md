# 0090 — Cada precio puede tener su moneda

## Contexto

La moneda era una sola por negocio (Información → Moneda). Una inmobiliaria alquila en soles y
vende en dólares; un tour al extranjero puede cobrarse en dólares o euros. El usuario pidió que
"las inmobiliarias o cualquier cosa" puedan usar soles, dólares y euros.

## Decisión

- La moneda del negocio sigue siendo la **por defecto**.
- Cada **producto** (columna `productos.moneda`, migración 0032), **oferta** y **servicio** (campo
  `moneda` dentro de su JSONB) puede tener la suya: `PEN`, `USD` o `EUR`. `null` = la del negocio.
- En el panel, el precio va con un selector S/ · $ · € delante (`SelectorMoneda`). Elegir la moneda
  del negocio guarda `null`, así ese precio sigue al negocio si este cambia de moneda.
- La app, el celular de vista previa y las listas del panel muestran cada precio con su moneda.
- Listado de un servicio sin negocios: "Todavía no hay negocios en este servicio." en vez de
  "No encontramos negocios con ese filtro" (que queda solo para cuando se buscó o filtró).
