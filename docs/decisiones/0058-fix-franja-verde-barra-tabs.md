# 0058 — Fix: franja verde debajo de la barra de tabs en iPhone

## Contexto

Reportado en vivo, con captura, por el usuario: al abrir la app instalada en su iPhone, quedaba
una franja verde grande entre la barra de tabs (Inicio/Servicios/Comunidad/Perfil) y el borde
físico de la pantalla.

## Causa

Efecto colateral de dos cambios de la [decisión 0055](0055-pwa-instalable-y-animaciones.md):

1. `viewport-fit=cover` hace que la app pueda dibujar debajo de la "barrita" de inicio del
   iPhone (antes, esa zona la reservaba Safari) — necesario para que la app se vea a pantalla
   completa de verdad, pero como consecuencia esa franja **ahora es responsabilidad de la app**
   pintarla, y nada lo estaba haciendo.
2. El fondo verde de marca que se le puso a `html`/`body` para evitar el flash blanco antes de
   que cargue el bundle (ver [decisión 0057](0057-animacion-carga-hoja.md)) se quedaba puesto
   **para siempre**, incluso después de que la app ya había cargado — así que cualquier zona que
   la barra de tabs no llegara a cubrir mostraba ese verde de fondo en vez del blanco/superficie
   real de la barra.

`react-native-safe-area-context` ya era una dependencia instalada (usada internamente por
`expo-router`/React Navigation) pero **nunca se había envuelto la app en `SafeAreaProvider`** —
sin eso, cualquier `useSafeAreaInsets()` devuelve siempre `{ top: 0, right: 0, bottom: 0, left:
0 }`, así que ningún componente tenía forma de saber cuánto medía esa zona.

## Solución

1. `app/_layout.tsx`: se agregó `SafeAreaProvider` envolviendo toda la app.
2. `(tabs)/_layout.tsx`: `useSafeAreaInsets()` — la barra de tabs ahora crece
   `height: 68 + insets.bottom` y usa `paddingBottom: Math.max(insets.bottom, 8)`, así que su
   propio fondo (blanco/superficie) cubre hasta el borde físico, sin dejar hueco.
3. `inyectar-head-pwa.js`: el `<style>` del fondo verde ahora tiene un id
   (`carga-elisur-fondo`) y el mismo script que retira la pantalla de carga (cuando `#root` ya
   tiene contenido) también lo retira — el verde de marca vuelve a ser solo "mientras carga",
   no un fondo permanente que compita con lo que la app realmente pinta.

## Validado

Compila y renderiza sin errores en el entorno de prueba disponible — pero ese entorno no tiene
un notch/home-indicator real, así que `env(safe-area-inset-bottom)` siempre da `0px` ahí (se
confirmó explícitamente) y `Math.max(0, 8) = 8`, igual que antes: sin regresión visible en el
navegador de escritorio. La prueba real —que la franja ya no aparezca— solo se puede confirmar
en un iPhone físico, pendiente de que el usuario la verifique tras el redeploy.
