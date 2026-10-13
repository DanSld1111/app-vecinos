# 0095 — La app se actualiza sola cuando hay una versión nueva

Fecha: 2026-10-13.

## Problema

La app instalada en el celular (PWA) queda abierta en memoria con la versión que cargó. Aunque se
publique una nueva, el vecino seguía viendo la anterior hasta cerrarla del todo.

## Qué se decidió

- `npm run build` ahora corre `construir-web.js`: hace el mismo `expo export` + `inyectar-head-pwa.js`
  de siempre y además pone un número de versión (el commit que despliega Vercel) dentro del bundle
  (`EXPO_PUBLIC_VERSION_APP`) y en `dist/version.json` (sin caché, por `vercel.json`).
- `AvisoNuevaVersion` (solo web) compara las dos:
  - al volver a la app desde segundo plano, si hay versión nueva **se recarga sola**;
  - mientras se usa, revisa cada 5 minutos y muestra «Hay una versión nueva · Actualizar».
- Recarga una sola vez por versión (sessionStorage), así no entra en bucle si el servidor tarda
  en servir la nueva.

## Panel de administración

Mismo mecanismo con Vite: `vite.config.ts` pone la versión en el bundle (`__VERSION_PANEL__`) y
genera `version.json`. En el panel **no se recarga solo** (podría perderse un formulario a medio
llenar): solo aparece abajo el aviso «Hay una versión nueva del panel» con «Actualizar» y «Después».
