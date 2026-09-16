# 0051 — Fix: el rate-limiting no distinguía usuarios en Render

## Contexto

Revisión de seguridad general ahora que la API vive en Render (`app-vecinos.onrender.com`),
detrás de su proxy/CDN — antes solo se había probado en `localhost`, donde no hay ningún proxy
de por medio.

## Causa

`@nestjs/throttler` (docs/tecnica/11-plan-seguridad.md, hallazgo #2) limita peticiones por IP —
100/min general y 5/min en login/recuperación. Para saber la IP real del cliente, Express
necesita que se le diga explícitamente que confíe en el proxy que tiene delante
(`app.set("trust proxy", ...)`); sin eso, toma como "IP del cliente" la del proxy interno de
Render, que es la misma para absolutamente todas las peticiones que llegan al servidor.

Confirmado en vivo contra el servidor real: tres pedidos con `X-Forwarded-For` distinto entre
sí consumían el mismo contador (`x-ratelimit-remaining: 99 → 98 → 97`), no contadores
independientes. Es decir, el límite de 5 intentos de login por minuto no era "5 por persona" —
era "5 en total, para todo el que esté usando la app en ese momento". Cualquiera podía agotarlo
a propósito (5 intentos de login fallidos, sin más) y dejar a todos los demás usuarios
bloqueados del login por un minuto, en bucle si se repite.

## Solución

`app.set("trust proxy", 1)` en `main.ts`, antes de cualquier otra configuración. Render agrega
un único proxy delante de la app, así que "confiar en 1 salto" es correcto — Express ahora lee
la IP real del cliente desde la cabecera `X-Forwarded-For` que pone ese proxy (no una que
pudiera falsificar el cliente directamente, porque Render sobreescribe esa cabecera antes de
reenviar la petición).

## Nota — no confundir con el hallazgo del código de recuperación

Al revisar esto también se re-confirmó el hallazgo #6, ya conocido y documentado como pendiente
en `docs/tecnica/11-plan-seguridad.md`: el código de recuperación de contraseña se sigue
imprimiendo en el log del servidor (`logCodigoDesarrollo`, `codigo-recuperacion.ts`) porque
todavía no hay proveedor de correo real. Esto ya no es un riesgo hipotético — la API está en
producción, y cualquiera con acceso al dashboard de logs de Render puede ver el código y
resetear la clave de cualquier cuenta. No se tocó ese código en este fix porque apagarlo sin
un proveedor de correo real rompería la función de recuperación de clave por completo — es una
decisión que depende de contratar ese proveedor (Horizonte 2 del plan), no un bug a corregir en
el código.
