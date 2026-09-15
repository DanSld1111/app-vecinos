# 0050 — Fix: el botón de volver podía dejar al usuario atascado

## Contexto

El usuario reportó que "a veces se bugea la app" — entra a Buscar y el botón de volver no
hace nada, quedando sin forma de salir de esa pantalla.

## Causa

Los 6 lugares de la app donde hay un botón de "volver" propio (no el nativo del sistema)
usaban `router.back()` sin verificar primero si en realidad había algo a lo que volver.
`router.back()` no hace nada si el historial de navegación de Expo Router está vacío en ese
momento — algo que puede pasar por varios motivos (recarga del bundle de JS, actualización
OTA, o simplemente llegar a esa pantalla sin haber navegado normalmente desde otra). Cuando
eso pasa, tocar "volver" no produce ningún error visible ni feedback — simplemente no pasa
nada, y como es el único control de salida en esas pantallas, el usuario queda atascado.

Encontrado en:
- `app/buscar.tsx` (el que reportó el usuario)
- `app/_layout.tsx` (header del detalle de negocio)
- `app/notificaciones/_layout.tsx`
- `app/(tabs)/servicios/_layout.tsx`
- `app/cuenta/index.tsx` (dos botones: cerrar el login de "modo gestión" y volver del editor)

## Solución

En los 6 lugares: `router.canGoBack() ? router.back() : router.replace(<ruta de respaldo>)`.
Si de verdad hay historial, se comporta exactamente igual que antes; si no, en vez de no
hacer nada, manda a una pantalla razonable (Inicio, o `/perfil`/`/servicios` según el
contexto) — nunca deja al usuario sin salida.

## Validado en vivo

Reprodujido el flujo real (modo prueba → Buscar) y confirmado que el botón de volver lleva
de vuelta a Inicio correctamente. No se pudo forzar el estado exacto de "historial vacío" en
este entorno de prueba (la protección de rutas redirige al login antes de llegar ahí sin
sesión), pero la corrección es el patrón estándar y correcto de Expo Router para este caso —
no depende de reproducir el estado exacto para ser válida.
