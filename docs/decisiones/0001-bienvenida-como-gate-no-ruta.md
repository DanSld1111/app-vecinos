# 0001 - Pantalla de bienvenida como gate de componente, no como ruta

Fecha: 2026-08-26
Estado: aceptada

## Contexto

La sección 10.4 del documento maestro exige que el permiso de ubicación se pida después de una pantalla que explique el beneficio, no al abrir la app. Con Expo Router, la forma más directa parecía ser una ruta separada `app/bienvenida.tsx` a la que se redirige antes de mostrar las pestañas.

## Decisión

La bienvenida se implementó como un componente (`src/componentes/PantallaBienvenida.tsx`) que `app/(tabs)/_layout.tsx` renderiza condicionalmente en vez del `Tabs`, hasta que el vecino continúa.

## Alternativas consideradas

- **Ruta `app/bienvenida.tsx` + redirect**: descartada. Expo Router resuelve `app/(tabs)/index.tsx` como la ruta raíz `/` (los grupos con paréntesis no aparecen en la URL). Tener además `app/index.tsx` o `app/bienvenida.tsx` como pantalla inicial real habría requerido que la ruta raíz `/` quedara libre para el redirect, lo que choca con que `(tabs)/index.tsx` también resuelve a `/`. El framework no permite dos archivos resolviendo la misma ruta.

## Consecuencias

- Se gana: no hay conflicto de rutas ni parpadeo de la barra de pestañas antes del gate.
- Se pierde: la bienvenida no es una URL navegable ni recibe deep link directo (no lo necesita, es un paso de una sola vez).
- Queda condicionado: cuando se agregue persistencia (Etapa 4), el estado "ya vio la bienvenida" debe guardarse en almacenamiento local (MMKV) para no repetirla en cada apertura; hoy vive solo en memoria del componente.
