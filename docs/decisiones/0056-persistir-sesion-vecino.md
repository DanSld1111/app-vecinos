# 0056 — Fix: la sesión de vecino se cerraba al cerrar la app instalada

## Contexto

Reportado en vivo por un vecino real (Juanita Pérez, cuenta ya registrada, confirmada en el
panel admin): al crear su cuenta desde el iPhone y luego cerrar el acceso directo instalado
("Agregar a inicio", ver [decisión 0055](0055-pwa-instalable-y-animaciones.md)), la sesión se
cerraba sola — tenía que volver a iniciar sesión cada vez.

## Causa

`useSesion.ts` (la sesión del vecino, la app pública) guardaba `usuario`/`token` solo en
memoria (un store de zustand sin `persist`). En iOS, cerrar un acceso directo instalado en
pantalla de inicio **mata el proceso entero** (a diferencia de solo cambiar de pestaña en
Safari normal), así que la próxima vez que se abre, todo el estado en memoria empieza de cero
— sin importar que el token JWT siguiera siendo válido por sus 30 días
(`JWT_EXPIRES_IN_VECINO`).

Esto no era un descuido: `docs/tecnica/11-plan-seguridad.md` (2 de septiembre) documentaba
explícitamente que el token vivía solo en memoria a propósito, como mitigación ante un XSS
hipotético. Pero esa decisión ya estaba desactualizada — el "modo gestión" de la misma app
(`useSesionCuenta.ts`) y el panel admin (`useSesionAdmin.ts`) **ya persistían** su sesión con
`AsyncStorage`/`localStorage` desde antes (ver [decisión 0021](0021-endurecimiento-post-diagnostico.md)),
sin que nadie hubiera vuelto a esta sección del doc a corregirla.

## Solución

Mismo patrón que `useSesionCuenta.ts`: `persist` con `AsyncStorage` (usa `localStorage` por
debajo en web), guardando solo `autenticado`/`usuario`/`token` (no `cargando`/`error`, que son
de una petición puntual). No hace falta validar el token al cargar: si venció, la primera
petición autenticada que falle con `401` ya dispara el cierre de sesión vía
`registrarManejadorSesionExpirada` (`clienteApi.ts`).

Se actualizó `docs/tecnica/11-plan-seguridad.md` para reflejar la decisión re-evaluada: el
costo de UX de no persistir (confirmado con un usuario real) pesa más que el riesgo teórico de
un XSS que, hasta hoy, no se ha encontrado en el proyecto (cero `dangerouslySetInnerHTML` en
`apps/admin` ni `apps/movil`).

## Validado en vivo

Modo prueba (invitado) → `localStorage` mostró la sesión guardada
(`elisur-sesion-vecino`) → recargar la página (equivalente a cerrar y reabrir la app
instalada) → fue directo a Inicio, sin pedir login de nuevo.
