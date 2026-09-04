# 0002 - Selector de comunidad como hoja inferior, no como pestaña

Fecha: 2026-08-26
Estado: aceptada

## Contexto

El tab bar original tenía una pestaña "Zona" dedicada a cambiar de comunidad. El cliente pidió reemplazarla por "Mi perfil" y manejar el cambio de comunidad con un patrón inspirado en el selector de dirección de apps de delivery (hoja inferior animada que se abre al tocar la ubicación en la barra superior).

## Decisión

Se creó `src/componentes/HojaInferior.tsx`, un bottom sheet genérico basado en `Modal` + `Animated` de React Native (sin librería externa), y `src/componentes/SelectorComunidad.tsx` con el contenido específico. Se usa en dos lugares: el chip de ubicación en Inicio y la fila "Cambiar de comunidad" en Mi perfil — mismo componente, dos puntos de entrada.

## Alternativas consideradas

- **Librería de bottom sheet** (`@gorhom/bottom-sheet`): descartada por ahora para no sumar una dependencia nativa más en Etapa 1, cuando `Modal` + `Animated` ya cubre la necesidad (animación de entrada/salida, fondo oscurecido, cierre al tocar fuera).
- **Mantener "Zona" como pestaña**: descartada por pedido explícito del cliente; además liberó un espacio en el tab bar para "Mi perfil".

## Consecuencias

- Se gana: un patrón de hoja inferior reutilizable para futuras selecciones (filtros, por ejemplo).
- Se pierde: el cambio de zona ya no es una URL/ruta propia navegable directamente.
- Queda condicionado: cuando exista más de una comunidad activa real, esta misma hoja debe soportar scroll y búsqueda si la lista crece.
