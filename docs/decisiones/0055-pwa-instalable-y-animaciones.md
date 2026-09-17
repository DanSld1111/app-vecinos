# 0055 — App instalable en iPhone ("Agregar a inicio") y animaciones nativas

## Contexto

El usuario preguntó cómo instalar la app en su iPhone. Hoy no existe compilación nativa (no
hay `eas.json`, ver conversación) — la única opción real, sin costo ni cuenta de Apple
Developer, es "Agregar a pantalla de inicio" desde Safari. Se configuró esa experiencia para
que se vea y se sienta como una app real, y se agregaron animaciones nativas donde faltaban.

## 1. "Agregar a inicio" en iPhone/Android

- **Íconos y splash screens**: `generar-pwa-assets.py` (nuevo, reutilizable — mismo patrón que
  `infraestructura/datos-semilla/generar-catalogo-ubigeo.js`) genera desde `assets/icon.png`:
  `apple-touch-icon.png` (180×180), `icon-192.png`/`icon-512.png`/`icon-512-maskable.png`
  (manifest), y 9 splash screens (uno por tamaño de pantalla de iPhone activo hoy — Apple exige
  coincidencia exacta por `media query`, no admite una imagen genérica).
- **`public/manifest.json`**: nombre, ícono, `theme_color`/`background_color` de marca,
  `display: standalone` (sin la barra de Safari al abrir desde el ícono).

### Por qué no se usó `app/+html.tsx` (la forma "oficial" de Expo Router)

Se intentó primero el mecanismo documentado de Expo Router para personalizar el `<head>` del
build web. Requiere `"output": "static"` en `app.json` — al activarlo, **el build entero dejó
de compilar**: un paquete interno de Expo (`@expo/router-server`, anidado varios niveles dentro
de `node_modules/expo`) no logra resolver `expo-router/internal/static` en este monorepo de npm
workspaces (mismo tipo de problema de hoisting ya documentado para `@nestjs/platform-express`
en `apps/api/src/main.ts`). Confirmado en vivo: build local fallaba con
`Unable to resolve module expo-router/internal/static`.

En vez de forzar eso a producción (con el riesgo real de romper el deploy de Netlify), se
optó por **`inyectar-head-pwa.js`**: un script que corre después de `expo export --platform
web` y agrega directamente al `dist/index.html` generado las etiquetas necesarias
(`apple-mobile-web-app-*`, `manifest`, `apple-touch-icon`, los 9 `apple-touch-startup-image`,
`viewport-fit=cover`, `lang="es"`, fondo verde de marca antes de que cargue el bundle). Se
encadenó en `package.json`: `"build": "expo export --platform web && node inyectar-head-pwa.js"`.
Se eliminó `app/+html.tsx` (quedaba sin efecto sin `output: static`, habría sido código muerto
y confuso).

**Verificado en vivo**: build de producción completo, `dist/index.html` inspeccionado
directamente — las 9 etiquetas de splash, el manifest, `apple-touch-icon` y `viewport-fit=cover`
quedan presentes.

### Otros ajustes

- `app.json`: `"name"` corregido de "App Vecinos" (desde antes del rebrand) a "ELISUR" — afecta
  el título de pestaña y el nombre que Android sugiere al instalar.
- `web.themeColor`/`web.backgroundColor` agregados (`#1a531a`, verde de marca).

## 2. Animaciones

- **`BotonPrimario.tsx`**: se envolvió en un `Animated.View` con `Animated.spring` en
  `onPressIn`/`onPressOut` (escala a 0.96 al presionar) — mismo patrón ya usado en los íconos
  de la barra de tabs (`(tabs)/_layout.tsx`, `IconoTab`). Antes no tenía ningún feedback táctil;
  ahora todos los botones primarios de la app lo heredan automáticamente (login, estados vacíos,
  permisos de notificaciones, etc. — es un componente compartido).
- **Transiciones entre pantallas**: `animation: "slide_from_right"` agregado a los 3 `Stack`
  de la app (`app/_layout.tsx`, `notificaciones/_layout.tsx`, `(tabs)/servicios/_layout.tsx`) —
  antes las pantallas nuevas aparecían de golpe, sobre todo notorio en la versión web.

## Qué falta para una app instalada 100% completa

"Agregar a inicio" no reemplaza una app nativa de verdad en todo: las notificaciones push
**no funcionan** en modo standalone de iOS (limitación de Apple, no de esta implementación —
si funcionan en Android). Para eso, y para aparecer en la App Store, hace falta EAS Build +
cuenta de Apple Developer (US$99/año) — ya discutido en la conversación, pendiente de decisión
de negocio, no técnica.
