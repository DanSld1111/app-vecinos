# 0017 — "Modo gestión" en `apps/movil`: dueño de negocio y junta vecinal publican desde la app

## Contexto

Hasta ahora `apps/movil` solo leía del servidor real ([decisión 0013](0013-movil-conectado-a-api.md));
publicar contenido (editar un negocio, redactar un aviso) solo era posible desde `apps/admin`.
El usuario pidió específicamente cerrar esa brecha: que un dueño de negocio o la junta vecinal
puedan hacerlo desde la app misma, sin tocar el panel. Se mantiene todo lo demás igual — la app
sigue viniendo con datos de ejemplo por defecto (`EXPO_PUBLIC_DATA_SOURCE=mock`); esto no cambia
ese comportamiento porque el "modo gestión" habla con la API real directamente, sin pasar por
`fabricaRepositorios`.

## Decisiones

**Es un sistema de sesión completamente aparte, no una extensión del login del vecino.**
`dueno_negocio` y `junta_vecinal` son roles de la tabla `cuentas` (la misma que usa `apps/admin`,
JWT con `JWT_SECRET`), mientras que el login que ya existía en la app es para `usuarios_app`
(vecinos, JWT con `JWT_SECRET_VECINO`) — son deliberadamente no intercambiables desde antes
([resumen de sesión previo](0013-movil-conectado-a-api.md)). Se creó `useSesionCuenta.ts`, un
store nuevo e independiente de `useSesion.ts`, que llama a `/auth/iniciar-sesion` (no
`/auth/vecino/...`). Una persona puede estar "vecino autenticado" (o en modo prueba) y además
entrar al modo gestión con su cuenta — son dos sesiones que conviven sin pisarse.

**Punto de entrada: una fila más en Mi perfil**, "¿Diriges un negocio o la junta vecinal?", que
lleva a `/cuenta` (pantalla completa, `presentation: "fullScreenModal"`). Si no hay sesión de
cuenta activa, `/cuenta` muestra el login de gestión; si la hay, muestra directamente la pantalla
según el rol. No se tocó `app/_layout.tsx` más que para registrar esta única ruta nueva.

**Los stores de gestión (`useGestionNegocio.ts`, `useGestionAvisos.ts`) son una traducción directa
de los que ya existían en `apps/admin`** (`useNegocios.ts`, `useAvisos.ts`), recortados a lo que
un dueño/junta puede hacer — nada de aprobar, rechazar o crear negocios desde cero, eso sigue
siendo exclusivo del panel. Mismos endpoints, mismo contrato, cero superficie nueva en el backend.

**`apiFetch` (con método/cuerpo/token) se agregó a `apps/movil/src/datos/api/clienteApi.ts`**, que
antes solo tenía `apiGet` (lecturas públicas sin token). Es la misma función que ya existía en
`apps/admin/src/datos/clienteApi.ts`, portada tal cual.

**Las pantallas de gestión llaman a `/categorias` y `/comunidades` directo con `apiGet`, sin pasar
por `fabricaRepositorios`/`useCategorias()`.** Esas listas normalmente pueden venir del mock (si
`EXPO_PUBLIC_DATA_SOURCE=mock`, el default), pero acá se necesitan los IDs reales — un negocio real
tiene `categoriaIds` reales, y asignarle un id de categoría mock rompería la relación. El "modo
gestión" es una función que solo tiene sentido con datos reales (se necesita una cuenta real para
entrar), así que siempre habla con la API real sin importar el interruptor de la app.

**Bug real encontrado y corregido — no solo en el código nuevo, también en `apps/admin`**: al
corregir un aviso rechazado y reenviarlo, el formulario mandaba `comunidadId` y `fuenteNombre`
además de `titulo`/`cuerpo`/`categoria`. El endpoint `PATCH /avisos/:id/reenviar`
(`ReenviarAvisoDto`) solo acepta esos tres últimos campos — con `class-validator` en modo
whitelist estricto, cualquier campo de más hace que rechace toda la petición
(`"property comunidadId should not exist"`). Nunca se había notado porque ninguna sesión anterior
llegó a probar en vivo específicamente el flujo "corregir un rechazo y reenviar" para junta
vecinal — solo se había probado aprobar/rechazar/publicar. Se corrigió en ambos lugares
(`apps/admin/src/paginas/MisAvisos.tsx` y la nueva `PantallaMisAvisos.tsx` de movil): el editor
ahora arma un payload distinto según el modo (`nuevo` manda el objeto completo, `corregir` manda
solo los tres campos que el servidor espera).

**Los íconos de categoría de negocio son nombres de Ionicons, no emojis** — se guardan así en la
base de datos (`categorias.icono`, ej. `"restaurant-outline"`) y `apps/movil` ya tenía un
componente (`IconoCategoria.tsx`) para renderizarlos correctamente; el primer intento los mostró
como texto literal ("restaurant-outline Comida") hasta usar ese componente.

## Validado en vivo

Contra la base de datos real, con las dos cuentas de prueba, desde la app corriendo en el
navegador (`expo start --web`):

- **María (dueña de "El Fogón Sanborjino" y "Postres Doña Herminia")**: login real en `/cuenta`;
  "Mis negocios" mostró sus dos negocios reales con su estado correcto; entró a "El Fogón
  Sanborjino", vio su información real (categorías con el ícono correcto, dirección, WhatsApp);
  cerró el horario del sábado y lo guardó — confirmado con una consulta directa a la base
  (`horarios->'sabado'` pasó a `cerrado: true`); agregó una oferta de prueba y la eliminó,
  confirmando ambos endpoints desde la app real.
- **Junta Vecinal SB**: login real; "Mis avisos" mostró sus 2 avisos reales (uno en revisión, uno
  rechazado con motivo real de la base); corrigió el rechazado y lo reenvió — primero falló con el
  bug de arriba, se corrigió el código, se repitió la prueba y esta vez sí pasó a "pendiente"
  (confirmado en la base: `estado='pendiente'`, `motivo_rechazo` vacío); redactó un aviso nuevo
  desde cero y lo envió a validación — quedó guardado en la base como `pendiente` real.

Se limpiaron todos los datos de prueba recreando la base desde cero (migraciones + semilla) al
terminar. `npx tsc --noEmit` corre limpio en `apps/movil` y `apps/admin` (los dos únicos avisos
restantes en movil — `HojaInferior.tsx` y `entorno.ts` — son preexistentes y no están relacionados
con este trabajo).
