# 0074 — Servicios: conteo real y orden por uso, "Guía de negocios" separada

## Contexto

La pantalla "Servicios" mezclaba en la misma grilla 2×2 a "Guía de negocios" (el buscador
general, sin filtro) junto a los 3 directorios específicos (Restaurantes, Market Space,
Supermarket) — la misma confusión de "todo mezclado" que ya había resuelto la decisión 0072
para la navegación, pero que seguía viéndose igual en esta pantalla. Las tarjetas de rubro
mostraban una descripción fija ("Platos y pedidos") que nunca cambiaba, en vez del número real
de negocios. Y "Próximamente" era una sola grilla plana de 8 tarjetas sin ningún agrupamiento.

## Decisión

- **"Guía de negocios" sale de la grilla** y pasa a ser una tarjeta ancha ("hero") propia,
  arriba de todo — con su propio texto "Busca en todo tu distrito" (antes decía "barrio";
  cambiado a pedido explícito, por sonar menos coloquial).
- **Conteo real por rubro**: `servicios-app.service.ts` agrega `ServicioApp.negocios` — cuenta
  negocios activos por `categorias.servicio_slug` (la misma relación de la decisión 0072). Para
  "Guía de negocios" (sin categorías propias) se sigue usando el conteo scoped a la comunidad
  activa que ya traía `useNegocios()`, no este campo global.
- **Orden por uso real**: nueva tabla `servicio_visitas` (migración 0023, mismo patrón que
  `negocio_visitas` de la decisión 0073) + `POST /servicios-app/:slug/visitas` (público). "Explora
  por rubro" ordena por `visitas7d DESC`, desempate por el campo `orden` del panel — ya no
  `orden` como único criterio.
- **"Próximamente" agrupado en 3 temas fijos en código** (`GRUPOS_PROXIMAMENTE` en
  `app/(tabs)/servicios/index.tsx`, mismo criterio que `RUTA_POR_SLUG` ya usa): "Negocios y
  turismo", "Movilidad y trámites", "Comunidad". Un servicio nuevo que no esté en ningún grupo
  cae automáticamente en el último — nunca desaparece de la pantalla por no estar ubicado
  todavía.
- **Contador arriba** ("4 de 12 ya activos en San Borja").
- **Se quitó el banner** "¿Qué servicio te gustaría ver aquí? Cuéntanos qué le falta a tu
  barrio" — a pedido explícito.

## Lo que se descartó (por ahora)

- **Separar Market Space/Supermarket en filas propias** si crecen mucho: hoy tienen 3 y 1
  negocio respectivamente — diseñar para un volumen que no existe todavía sería anticipar una
  necesidad hipotética. El layout en grilla (`flexWrap`) ya se adapta solo a la cantidad real de
  tarjetas, así que no hay nada bloqueando hacerlo después si hace falta.
- **Botón "Avísame" por servicio próximamente**: se puede agregar sin tocar la estructura actual
  cuando se decida construirlo.

## Limitación conocida

El conteo de negocios por servicio (`ServicioApp.negocios`) es global (todas las comunidades),
no por comunidad activa — `servicios_app` es un catálogo compartido, sin columna de comunidad.
No es un problema hoy (San Borja es el único distrito piloto activo), pero si se lanza una
segunda comunidad este número dejará de ser exacto para esa comunidad específica.
