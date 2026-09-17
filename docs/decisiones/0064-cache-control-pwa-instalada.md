# 0064 — Cache-Control para que la app instalada sí reciba actualizaciones

## Contexto

Todos los fixes de 0058 a 0063 estaban correctos y ya en producción — verificado directamente
contra el HTML que sirve Vercel. El usuario confirmó que en **Safari normal** (recarga fresca)
la app se ve perfecta. El problema apareció solo en el **ícono instalado** en su pantalla de
inicio: seguía mostrando una versión vieja, aunque el servidor ya tuviera la nueva.

## Por qué esto es más grave de lo que parece

No es solo un inconveniente de esta sesión de pruebas — es un problema estructural: un "acceso
directo" de iOS a una PWA corre en su propio proceso de WebKit, que **no necesariamente vuelve a
pedir `index.html` al servidor en cada apertura** si no se le dice explícitamente que no debe
usar una copia guardada. Sin la cabecera correcta, **cualquier vecino real que ya se instaló
ELISUR se queda viendo la versión del día que la instaló, para siempre**, sin enterarse de que
hay una versión nueva — no es un bug de una sola vez, es un problema que se repetiría con cada
actualización futura del app móvil.

## Solución

`vercel.json` ahora fuerza `Cache-Control: no-cache, must-revalidate` en todas las rutas
**excepto** `_expo/` (el bundle de JS y assets, que sí llevan un hash único por build en el
nombre de archivo — esos sí conviene que se guarden agresivo, nunca cambian de contenido bajo el
mismo nombre). `no-cache` no significa "no guardar nada" — significa "guardar, pero preguntarle
siempre al servidor si sigue vigente antes de usarlo" (a diferencia de no poner la cabecera, que
deja a cada navegador/WebView decidir por su cuenta cuánto tiempo confiar en la copia guardada
sin preguntar).

## Qué esto NO arregla (acción manual pendiente, una sola vez)

Este cambio evita que el problema **vuelva a pasar**, pero no fuerza a los íconos **ya
instalados hoy** (incluido el de prueba del usuario) a actualizarse solos de inmediato — para
eso, todavía hace falta el mismo procedimiento manual de siempre: borrar el ícono, limpiar los
datos del sitio en Ajustes → Safari → Avanzado → Datos de sitios web, y volver a agregarlo. Una
vez hecho eso con esta cabecera ya en el servidor, las próximas actualizaciones deberían llegar
solas sin repetir el proceso.
