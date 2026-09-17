# 0063 — Fix definitivo del espacio en blanco: medir el alto con JavaScript, no con CSS

## Contexto

Después de tres intentos con CSS (`100%` → `100dvh` en 0060, ajuste de status bar en 0062), el
usuario seguía viendo el mismo espacio en blanco grande debajo de la barra de tabs. El patrón de
"se arregla, después de otro cambio se vuelve a romper" indicaba que el problema no era una
unidad CSS específica, sino que **el propio cálculo de "alto de pantalla" en Safari/iOS
standalone es inconsistente** entre combinaciones de modo de status bar, versión de iOS, etc. —
perseguirlo unidad por CSS por unidad CSS (`vh`, `dvh`, `%`) no es sostenible.

## Solución

Se abandona el enfoque CSS por completo para esto. En su lugar, un script mínimo mide el alto
real con JavaScript (`window.innerHeight` — no depende de qué unidad CSS interprete bien el
navegador) y lo fija directo como estilo en línea sobre `html`, `body` y `#root`:

```js
function medirYFijarAlto() {
  var alto = window.innerHeight + "px";
  document.documentElement.style.height = alto;
  document.body.style.height = alto;
  document.getElementById("root").style.height = alto;
}
```

Se vuelve a medir en `resize` y `orientationchange` (con un pequeño delay en este último, porque
iOS tarda un instante en reportar las dimensiones correctas después de rotar). Un estilo en
línea (`element.style.height`) le gana a cualquier regla de una hoja de estilos sin importar su
especificidad, así que esto reemplaza de forma confiable cualquier `height:100%`/`100dvh` que
haya puesto expo-router o los intentos anteriores.

## Por qué esta vez debería ser definitivo

A diferencia de `vh`/`dvh`/`%`, `window.innerHeight` es una medición en vivo del propio
navegador sobre su viewport visual real — no una unidad que cada motor de renderizado pueda
interpretar distinto según el modo de la barra de estado, si hay teclado abierto, etc. Es el
mismo patrón que usan librerías consolidadas (ej. `100vh` polyfills de Bootstrap/Tailwind) para
este exacto problema, conocido y documentado desde hace años en Safari/iOS.

## Pendiente

Sigue sin poderse probar en un dispositivo real desde este entorno — validado solo con
`npm run build` (compila y el script queda presente en el `dist/index.html` final). El usuario
además reportó el saludo de Inicio "difuminado" en el mismo mensaje que el espacio en blanco —
ese síntoma se atacó por separado en la [decisión 0062](0062-fix-status-bar-difuminado.md)
(status bar translúcido); falta confirmar si ese fix ya alcanzó, por separado del espacio en
blanco que ataca este commit.
