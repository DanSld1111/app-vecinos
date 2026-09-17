# 0061 — Contenido pegado al notch/Dynamic Island (parte de arriba)

## Contexto

Con la app instalada a pantalla completa ya funcionando bien abajo (0058-0060), el usuario
reportó que ahora **arriba** el saludo ("Buenas tardes / San Borja hoy") se ve mal — mismo tipo
de problema que la barra de tabs, pero en el otro extremo de la pantalla: antes la barra de
Safari cubría esa zona, ahora que la app usa toda la pantalla, el notch/Dynamic Island le queda
encima al contenido.

## Causa

A diferencia de la barra de tabs (que `@react-navigation/bottom-tabs` ya sabía manejar sola una
vez con `SafeAreaProvider` en el árbol, ver 0059), **no hay ningún mecanismo automático
equivalente para contenido personalizado arriba** en una pantalla con `headerShown: false`. Cada
pantalla con su propio "header" hecho a mano (no el nativo de `Stack`/`Tabs`) tenía un
`paddingTop` fijo en píxeles, sin `insets.top`.

## Solución

`useSafeAreaInsets().top` sumado al `paddingTop` existente (no reemplazado — se mantiene el
espaciado visual de diseño, solo se le agrega lo que ocupa el notch) en cada pantalla con
contenido propio pegado arriba:

- `BarraSuperior.tsx` (el saludo de Inicio — el que reportó el usuario)
- `(tabs)/comunidad.tsx`, `(tabs)/perfil.tsx`, `(tabs)/servicios/index.tsx` (mismo patrón:
  `ScrollView` con `contentContainerStyle` de padding fijo)
- `buscar.tsx` y `cuenta/index.tsx` (pantallas `fullScreenModal`, con su propio header simulado)
- `FlujoLogin.tsx` (`PantallaIngreso`, la pantalla de login con el fondo verde) y
  `LoginCuenta.tsx` (las 3 sub-pantallas del login de "modo gestión") — mismo problema, el
  fondo de color sí debe llegar hasta el borde (eso está bien, es el diseño), pero el
  contenido (logo, texto, formulario) no debe quedar debajo del notch.

`Onboarding.tsx` no se tocó — su contenido está centrado verticalmente (`justifyContent:
"center"`), con margen de sobra respecto al notch en la mayoría de tamaños de pantalla.

## Sobre "que se adecue a cualquier pantalla, por defecto"

El pedido completo del usuario incluía que la app se vea bien en "cualquier pantalla de un
dispositivo móvil o tableta". Este fix resuelve la parte concreta y reportada (notch/Dynamic
Island tapando contenido) — la app ya está construida con Flexbox/porcentajes, así que en
general se adapta razonablemente a distintos tamaños de celular. **Un diseño optimizado
específicamente para tablet** (columnas múltiples, tamaños de toque más grandes, etc.) es un
proyecto de diseño aparte, más grande, que no se intentó acá — no hay evidencia de que se haya
probado en una tableta todavía.
