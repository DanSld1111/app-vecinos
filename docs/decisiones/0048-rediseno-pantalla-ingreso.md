# 0048 — Rediseño de la pantalla de ingreso (login)

## Contexto

Con el nuevo logo (decisión 0047) ya en la app, el usuario pidió mejorar visualmente la
pantalla de ingreso. Se exploraron varios bocetos (fondo blanco minimalista, bloque de color,
split como el panel admin, tarjeta flotante sobre fondo verde) antes de elegir un diseño
final: fondo verde a pantalla completa con formas circulares decorativas, una insignia
pequeña con el isotipo, y una tarjeta blanca flotante con el formulario.

También se cambió la frase de bienvenida — "Encuentra todo lo de tu barrio" tenía un doble
sentido no intencional en español coloquial — por: **"Uniendo a cada vecino para hacer
crecer la comunidad de nuestro distrito."**

## Cambios

Solo se tocó `PantallaIngreso` dentro de `FlujoLogin.tsx` (no las pantallas de registro,
recuperación de clave, etc. — esas mantienen el fondo claro de siempre, no se pidió
cambiarlas):

- Fondo `colores.primario` (verde) a pantalla completa, con dos círculos decorativos
  semitransparentes (`overflow: hidden` en el contenedor para recortarlos en los bordes).
- Insignia cuadrada con el isotipo (mismo trazo SVG que `IlustracionSaludo`, pero en blanco
  puro sobre un fondo translúcido — se define localmente como `IsotipoBlanco` porque
  `IlustracionSaludo` está pensado para fondos claros, no para ir sobre el propio verde de
  marca) + la palabra "ELISUR" como etiqueta pequeña encima del titular.
- Titular nuevo, sin la caja/ilustración intermedia que tenían los primeros bocetos — se
  descartó por pedido del usuario ("elimina la imagen y mejora la posición del mensaje").
- El formulario completo (correo, contraseña, botón, Google, crear cuenta, modo prueba, pie
  legal) ahora vive dentro de una tarjeta blanca (`tarjetaIngreso`) en vez de ir directo sobre
  el fondo de la pantalla.
- `EncabezadoMarca` (el componente que mostraba el ícono + nombre en la versión anterior)
  se eliminó — ya no se usaba en ningún otro lado.
- `pieLegal` dependía de `marginTop: "auto"` para pegarse abajo en el layout viejo (un `View`
  con `flex: 1`); dentro de la tarjeta nueva (que no es `flex: 1`) eso no funciona, así que se
  cambió a un margen fijo.

## Validado en vivo

Probado en local a 375×812 (tamaño real de celular) — todo el contenido de la tarjeta entra
sin cortes ni necesidad de scroll: título, campos, botón, divisor, botón de Google, enlace de
modo prueba y texto legal, todo visible.
