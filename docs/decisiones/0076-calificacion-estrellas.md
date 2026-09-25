# 0076 — Calificación por estrellas (con medias estrellas), sin reseñas escritas

## Contexto

La decisión 0075 había quitado del lado móvil el sistema de reseñas con estrellas + comentario
(`ResenasNegocio.tsx`, `useResenas.ts`), dejando intacto el módulo `resenas` del backend por si
hacía falta después. El usuario pidió reactivarlo, pero en una versión más simple: solo el
número de estrellas, sin comentarios ni lista de reseñas, visible de forma sutil en la ficha,
con la acción de calificar movida al menú ⋮, y el promedio visible junto al nombre en las
tarjetas de listado.

## Decisión

- **Medias estrellas**: `resenas.calificacion` pasa de `SMALLINT` (1-5 enteros) a `numeric(2,1)`
  (migración 0026) — `paquetes/tipos/src/resena.ts` define `Calificacion = 1 | 1.5 | 2 | … | 5`.
  Se toca la mitad izquierda o derecha de una estrella para elegir X.0 o X.5
  (`HojaCalificar.tsx`, `calificacionDesdeToque()`).
- **En la ficha, solo una línea sutil** debajo de la descripción: "★ 4.6 (12 calificaciones)",
  o "★ Sé el primero en calificar" si el negocio todavía no tiene ninguna — nunca "0.0 (0)".
  Tocarla abre el mismo selector que el menú ⋮.
- **"Calificar este negocio" vive en el menú ⋮** (`MenuAccionesNegocio.tsx`), entre
  "Información del negocio" y "Compartir" — no hay un botón grande en el cuerpo de la ficha.
- **Se puede cambiar en cualquier momento**: mismo `ON CONFLICT (negocio_id, usuario_id) DO
  UPDATE` que ya tenía `resenas.service.ts` — un vecino, una calificación por negocio, editable.
- **Solo un vecino con cuenta real puede calificar** — mismo criterio que favoritos
  (`JwtVecinoAuthGuard`); "modo prueba" recibe un aviso explicando que necesita cuenta, sin
  mandarlo a `/cuenta` (que es el login de "modo gestión", de otro tipo de usuario).
- **`Negocio.calificacionPromedio` / `calificacionTotal`**: nueva subconsulta correlacionada en
  `COLUMNAS_NEGOCIO` (`negocios.mapeo.ts`), mismo patrón que `visitas7d` — así el promedio va
  incluido en cualquier respuesta de negocio (listados y ficha) sin una llamada aparte.
  `calificacionPromedio` es `null` (no `0`) cuando nadie calificó todavía.
- **★ + número junto al nombre**, en las 3 plantillas de tarjeta (`TarjetaNegocio.tsx`,
  `TarjetaNegocioMenu.tsx`, `TarjetaNegocioCatalogo.tsx`) — solo cuando `calificacionTotal > 0`;
  sin calificaciones, la tarjeta no agrega nada ahí (ver "descartado" abajo).

## Lo que se descartó / simplificó

- **Sin comentarios ni lista de reseñas** — a propósito, a diferencia del sistema anterior. El
  campo `comentario` sigue existiendo en la tabla y el DTO (`CrearResenaDto`) por compatibilidad
  con lo que ya había, pero la app no lo pide ni lo muestra.
- **"Sé el primero en calificar" solo en la ficha**, no en las tarjetas de listado — repetir ese
  texto en cada tarjeta de una lista larga (Restaurantes, Market Space, "Cerca de ti") sería más
  ruido que señal; en las tarjetas, un negocio sin calificaciones simplemente no muestra nada de
  estrellas todavía, hasta que tenga al menos una.
