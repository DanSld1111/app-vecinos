# 0036 — "Fotos" y "Estado" en el modo gestión de la app

## Contexto

El usuario, probando como dueño de negocio, notó que la app solo dejaba gestionar Información,
Horario y Ofertas — mientras que el panel admin (`Mi negocio` en el sidebar de `dueno_negocio`)
ya tiene 5 secciones: Mi negocio, Horario, **Fotos**, Ofertas, **Estado**. La app se había quedado
atrás del panel en dos secciones completas.

El backend ya soportaba todo esto desde antes (`POST /negocios/:id/foto`, `POST/DELETE
/negocios/:id/galeria`, `POST /negocios/:id/productos/:productoId/foto`, todos protegidos solo
con `JwtAuthGuard` — sin `@Roles`, porque el servicio ya valida que la cuenta sea dueña de ese
negocio) — era pura falta de UI en `apps/movil`, nunca se había construido.

## Decisión

Se agregaron las pestañas **Fotos** y **Estado** a `PantallaMiNegocio.tsx`, reflejando 1:1 lo que
ya hace `apps/admin/src/paginas/MiNegocioFotos.tsx` / `MiNegocioEstado.tsx`:

- **Fotos**: foto principal (subir/cambiar), fotos de cada producto del menú/catálogo (solo si el
  negocio tiene productos), galería de hasta 6 fotos (solo relevante si no tiene menú/catálogo).
- **Estado**: tarjeta grande con el estado visual (activo/pendiente/rechazado, mismo criterio que
  `estadoVisualDe()` del panel — si hay `motivoRechazo` manda sobre el estado de la fila) + línea
  de tiempo de validación, de solo lectura (nunca se pudo "des-activar" un negocio ni desde el
  panel, así que tampoco acá).

Como la app nunca había necesitado elegir una foto del dispositivo, se sumó `expo-image-picker`
(instalado con `npx expo install`, resolviendo la versión exacta para Expo SDK 57) y un pequeño
helper (`elegirImagen()`) que pide permiso y abre la galería. La subida en sí usa un
`apiSubirArchivo()` nuevo en `clienteApi.ts`, cross-platform: en web usa el `File` real que
`expo-image-picker` ya entrega ahí; en nativo arma el objeto `{ uri, name, type }` que React
Native sabe subir directo desde el archivo local, sin leerlo primero a memoria.

## Corregido en el camino

Al verificar en vivo, la cuenta de prueba `maria@elfogon.pe` (dueña de El Fogón Sanborjino) no
podía iniciar sesión — el hash guardado en la base no correspondía a la contraseña de prueba
documentada (`negocio123`), aunque el resto de cuentas sí coincidían. Se regeneró el hash en la
base de datos de desarrollo para esa cuenta específica; no se tocó ninguna otra.

## Validado en vivo

Con la cuenta de María Quispe: la pestaña Fotos muestra el slot de foto principal, los 4
productos de "El Fogón Sanborjino" con su botón "Subir foto" cada uno, y la galería con el botón
"＋ Agregar". La pestaña Estado se probó en sus dos variantes reales: "El Fogón Sanborjino"
(activo, con línea de tiempo completa) y "Postres Doña Herminia" (rechazado, mostrando el motivo
real de rechazo). El flujo de selección de archivo abre sin errores de consola; la subida en sí
depende del selector nativo del sistema operativo, que esta sesión de navegador automatizado no
puede completar — el código reutiliza el mismo patrón ya probado en el panel admin.
