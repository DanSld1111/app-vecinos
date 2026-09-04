# 0038 — La sesión del panel ya sobrevive a un F5

## Contexto

El usuario reportó que cada vez que recargaba la página del panel (F5), la sesión se cerraba y
tenía que volver a ingresar. Causa: `useSesionAdmin.ts` es un store de zustand normal, sin
ninguna persistencia — vive solo en memoria del navegador, así que cualquier recarga completa de
la página lo reinicia a su estado inicial (`cuenta: null, token: null`), aunque el token JWT
siguiera siendo válido en el servidor.

## Decisión

Se envolvió el store con el middleware `persist` de zustand (ya venía incluido con la versión 5,
sin instalar nada nuevo), guardando `cuenta` y `token` en `localStorage` bajo la clave
`elisur-admin-sesion`. Explícitamente **no** se persiste `cargando` ni `error` (son estado de una
petición puntual, no de la sesión — si quedaran guardados, un F5 a mitad de un pedido podría
reabrir el panel mostrando un error viejo).

No hizo falta validar el token al cargar: si quedó vencido (o la cuenta se desactivó mientras
tanto), la primera petición autenticada que haga falla con 401 y dispara `sesionExpiro()` — el
mismo mecanismo que ya existía para cuando el token vence a mitad de sesión (ver
[0021](0021-endurecimiento-post-diagnostico.md)).

## Extendido a la app móvil

El "modo gestión" de la app (`apps/movil/src/estado/useSesionCuenta.ts`, para dueño de negocio y
junta vecinal) tenía exactamente el mismo problema. Se corrigió con el mismo `persist`, pero acá
`localStorage` no existe fuera de web — se instaló `@react-native-async-storage/async-storage`
(vía `npx expo install`, que resuelve la versión exacta para el SDK de Expo del proyecto) y se
usó como backend de `persist` con `createJSONStorage(() => AsyncStorage)`. En web, esa librería
ya guarda por debajo en `localStorage`; en nativo usa el almacenamiento propio de la plataforma
— mismo código, sin ramas por plataforma.

## Validado en vivo

**Admin**: login → recarga completa de página (`navigate`, no solo re-render) → sigue en el
Dashboard, con la sesión y los datos (4 distritos activos) intactos, sin volver a pedir
correo/contraseña.

**App móvil**: login en "Modo gestión" con la cuenta de María Quispe → recarga completa de la
página → vuelve a pasar por la pantalla de vecino (comportamiento esperado, es una sesión
distinta) → al volver a `/cuenta` entra directo a "Mis negocios" de María, sin pedir el login de
Modo gestión de nuevo.
