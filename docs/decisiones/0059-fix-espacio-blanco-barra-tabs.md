# 0059 — Fix real de la franja bajo la barra de tabs (0058 se quedó corto)

## Contexto

El fix de la [decisión 0058](0058-fix-franja-verde-barra-tabs.md) no funcionó — probado en un
iPhone real, la franja seguía apareciendo, ahora como un espacio en blanco todavía más grande
que antes (reportado con captura y círculo rojo por el usuario).

## Causa real

`(tabs)/_layout.tsx` fijaba `height: 68, paddingBottom: 8, paddingTop: 8` en `tabBarStyle` —
código que ya existía **desde antes** de esta conversación, no algo agregado en 0058.
`@react-navigation/bottom-tabs` (`BottomTabBar.js`) ya sabe sumar `insets.bottom`
automáticamente a la altura y al padding de la barra — pero solo si el `style` que se le pasa
**no** trae esas propiedades: internamente arma un array de estilos
`[calculado-con-insets, tabBarStyle]`, y como `tabBarStyle` va al final, cualquier `height` o
`paddingBottom` explícito ahí **siempre gana**, con o sin `SafeAreaProvider` en el árbol.

Es decir: agregar `SafeAreaProvider` (0058) era necesario pero no suficiente — el
`height`/`paddingBottom` fijos seguían bloqueando el cálculo automático de la librería. El
intento de "arreglarlo" sumando `insets.bottom` a mano (`height: 68 + insets.bottom`,
`paddingBottom: Math.max(insets.bottom, 8)`) generaba un valor final correcto en teoría, pero
dejaba a los íconos (que ya estaban centrados con `alignItems`/`justifyContent: "center"`
dentro de esa barra) empujados hacia arriba dentro de una barra mucho más alta — de ahí el
espacio en blanco grande que reportó el usuario, peor que la franja angosta original.

## Solución

Quitar `height` y `paddingBottom` de `tabBarStyle` por completo — dejar que
`@react-navigation/bottom-tabs` calcule ambos solo (usa su propio `useSafeAreaInsets()`
internamente, que ahora sí funciona gracias al `SafeAreaProvider` de 0058). Solo quedan en
`tabBarStyle` las propiedades puramente visuales (`backgroundColor`, `borderTopColor`,
`paddingTop` — el notch/Dynamic Island no afecta el padding superior de una barra en la parte
de abajo de la pantalla, ese sí es seguro fijarlo).

## Por qué no se pudo volver a validar en vivo antes de subir

El entorno de pruebas (navegador local) tuvo fallas intermitentes al momento de este fix y no
se pudo tomar una captura de confirmación antes de subir el cambio — la corrección se basa en
haber leído directamente el código fuente de `@react-navigation/bottom-tabs`
(`getTabBarHeight()` en `BottomTabBar.js`), que confirma el comportamiento exacto descrito
arriba, no en una prueba visual. Pendiente de que el usuario lo confirme en su iPhone real tras
el próximo deploy — si el problema persiste, es la señal de que hay algo más además de esto.
