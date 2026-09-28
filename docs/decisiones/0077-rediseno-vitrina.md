# 0077 — Rediseño "Vitrina" de la app del vecino

**Fecha:** 2026-09-28 · **Estado:** en prueba local (rama `rediseno-vitrina`), sin publicar

## Contexto

La app se veía como muchas apps hechas con IA: títulos en Fraunces (serif en negrita) con cuerpo
en Plus Jakarta Sans, íconos dentro de cuadrados pastel, tarjetas blancas con sombra en todas las
pantallas, rótulos grises en mayúsculas y una frase gancho bajo cada título. Además faltaban fotos.

## Decisión

Dirección "Vitrina", con tres detalles tomados de la dirección "Guía" (título "¿Qué buscas hoy?",
buscador debajo y categorías como fotos redondas). Maqueta de referencia:
https://claude.ai/artifact/GfJgQmqeWjsb7h2pdUpMmx

- **Tipografía:** Schibsted Grotesk en toda la app (800 para nombres y títulos, 400 para leer).
- **Color:** neutros casi grises en vez de menta; el verde de marca solo en la acción principal.
  `textoTenue` pasa de #96a091 (2,7:1) a #6b746e (4,8:1). Tokens nuevos: `calificacion`, `abierto`.
- **Fotos primero:** `FotoNegocio` (expo-image, fundido de 250 ms) en todas partes; sin foto se
  muestran las iniciales en verde sobre gris verdoso, nunca un recuadro vacío.
- **Estructura:** filas con líneas finas en vez de tarjetas con sombra; títulos de sección en
  minúscula inicial; sin emojis en la interfaz (íconos de línea).
- **Movimiento** (todo con `Animated`, sin librerías nuevas de animación):
  portada de la ficha que entra acercándose y parallax al desplazar, barra con el nombre al
  bajar, corazón que late con vibración (`expo-haptics`), oferta de Inicio que pasa sola con barra
  de progreso, hojas inferiores que se cierran arrastrando, barra de pestañas con rayita que se
  desliza y fundido entre pestañas. Todo respeta "reducir movimiento" (`useMovimientoReducido`).
- **Textos:** "comunidad" en vez de "barrio"; "Entrar en modo invitado" en vez de "modo prueba".
  El login sigue siendo con correo y contraseña.

## Pendiente

- Transición de "foto compartida" real entre la tarjeta y la ficha: hoy es una aproximación
  (la portada entra acercándose). La real necesita `react-native-reanimated`.
- Fotos de categoría para las que aún no tienen (se ven con iniciales).
- Pantallas de "modo gestión" (dueño de negocio / junta) solo heredan fuente y colores.
