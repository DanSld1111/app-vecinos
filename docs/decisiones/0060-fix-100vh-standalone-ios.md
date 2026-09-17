# 0060 — Fix: espacio en blanco al fondo, en toda la app (no era la barra de tabs)

## Contexto

Después de [0058](0058-fix-franja-verde-barra-tabs.md) y [0059](0059-fix-espacio-blanco-barra-tabs.md),
el usuario seguía viendo un espacio en blanco grande al fondo de la pantalla — confirmado con
captura, y confirmado que el deploy con el fix de 0059 sí estaba "Ready" en Vercel. Dato clave
que descartó la barra de tabs como causa: **aparecía en todas las pantallas por igual**, no solo
donde se ve esa barra.

## Causa real

Bug conocido de Safari/iOS: en una app **instalada** a pantalla completa ("standalone", ver
[decisión 0055](0055-pwa-instalable-y-animaciones.md)), `height: 100%`/`100vh` — que es
justamente lo que usa el reset por defecto de `expo-router` (`#expo-reset`,
`html,body{height:100%}` y `#root{height:100%}`) — **no siempre coincide con el alto real
visible** en ese modo. Deja un espacio de sobra al fondo que no tiene nada que ver con el área
segura del home indicator (eso sí lo maneja bien `@react-navigation/bottom-tabs`, confirmado en
0059) — es la propia medida de "tamaño de pantalla" la que está mal, para toda la página.

## Solución

`inyectar-head-pwa.js` agrega ahora una regla con `@supports (height: 100dvh)` que fuerza
`html, body, #root` a `100dvh` ("dynamic viewport height", la unidad pensada específicamente
para este problema) en vez de `100%`/`100vh`. Con `@supports`, en navegadores/plataformas sin
soporte (Android, navegadores viejos — donde esto nunca fue un problema) simplemente no aplica y
se queda con el comportamiento original.

## Estado

Pendiente de confirmación del usuario en su iPhone real tras el próximo deploy — no se pudo
reproducir el bug en el entorno de pruebas local (el navegador de escritorio no tiene el modo
standalone de iOS donde ocurre).
