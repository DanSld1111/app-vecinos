# 0075 — Ficha: buscador en el header, pantalla de Información, y favoritos reales

## Contexto

La ficha de negocio repetía el nombre dos veces (header + cuerpo), no tenía forma de buscar
dentro de su propio menú/catálogo/servicios sin usar buscadores distintos por tipo de ficha, y
mezclaba horario/mapa/reseñas con el contenido del negocio en una sola pantalla larga. Al mismo
tiempo, "Favoritos" en Perfil era un stat card decorativo marcado "Próximamente" sin ningún
mecanismo detrás, y "Reseñas" con estrellas se decidió sacar del producto.

## Decisión

- **Header de la ficha**: flecha de volver + un buscador único ("Buscar en {nombre real}") +
  ❤️ favorito + ⋮ (menú de acciones) — sin header nativo (`headerShown:false`, mismo criterio
  que `servicios/_layout.tsx`). El nombre del negocio ya no aparece en la ficha en absoluto: ya
  se vio en la tarjeta del listado antes de entrar.
- **Un solo buscador para los 4 tipos de contenido**: `MenuNegocio`, `CatalogoNegocio`,
  `ServiciosNegocio` y `OfertasPasillosNegocio` reciben `busqueda` como prop en vez de tener su
  propio `TextInput` interno — Catálogo y Ofertas ya tenían uno propio (se quitó), Menú y
  Servicios no tenían ninguno (se agregó el filtro).
- **⋮ abre una hoja** (`MenuAccionesNegocio.tsx`) con el nombre del negocio arriba, y dos
  acciones: "Información del negocio" y "Compartir" (sin cambios: nombre + descripción, ahora
  con el link real `dawan.dev` — `marca.dominio` ("elisur.app") todavía no apunta a nada; se
  cambia por el link de la tienda correspondiente cuando la app exista en App Store/Play Store).
- **Pantalla nueva "Información del negocio"** (`app/negocio/[id]/informacion.tsx`): logo/foto +
  nombre, `MiniMapaNegocio` (vuelve a usarse — estaba huérfano desde que `PanelHorarioMapa`
  reemplazó su lugar en la ficha), horario completo **siempre expandido** (lunes a domingo, hoy
  resaltado — sin el botón de mostrar/ocultar que sí tiene el panel compacto de Inicio, acá hay
  espacio de sobra) y "Acerca del negocio" (nuevo campo, ver abajo). Sin reseñas, sin
  "Servicios" (esa palabra ya la usa el arquetipo de ficha para otra cosa), sin medios de pago.
- **`Negocio.acercaDelNegocio`** (migración 0024, columna `acerca_del_negocio`, nullable): texto
  libre que escribe el propio dueño desde `EditorInfoNegocio.tsx` en el panel — mismo permiso
  que edita nombre/descripción hoy. `null` mientras no lo complete; la sección simplemente no
  aparece (nunca se inventa un texto de relleno).
- **Favoritos, función real** (antes solo un placeholder "Próximamente"): tabla `favoritos`
  (migración 0025, `usuario_id` + `negocio_id`, únicos), módulo `FavoritosModule` en el backend
  con `GET /favoritos` (negocios completos), `GET /favoritos/ids` (solo ids, para pintar el
  corazón de cualquier ficha sin traer cada negocio entero) y `POST`/`DELETE /favoritos/:id` —
  los cuatro detrás de `JwtVecinoAuthGuard`, igual que reseñas. Solo un vecino con cuenta real
  puede tener favoritos: "modo prueba" (`usuario: null`, `token: null` en `useSesion`) no tiene
  a quién asociarlos, así que el corazón en ese caso muestra un aviso en vez de fallar o mandar
  a la persona a `/cuenta` (que es el login de "modo gestión" — de un dueño de negocio, no de un
  vecino; mandarlo ahí habría sido confuso).
- **Perfil**: el stat card de Reseñas se quitó (la función se sacó del producto, no tenía
  sentido seguir prometiéndola). El de Favoritos pasa de decorativo a una fila real, con el
  conteo verdadero, que abre `app/favoritos.tsx` — lista los negocios favoritos
  (`TarjetaNegocio`, misma tarjeta que el resto de la app), con su propio estado para "modo
  prueba" (explica que hace falta cuenta) y para "todavía no guardaste ninguno".
- Se borraron `ResenasNegocio.tsx` y `useResenas.ts` del lado móvil, al quedar sin ningún uso.
  El módulo `resenas` del backend y su tabla se dejan intactos — no es una decisión de borrar el
  dato ni el feature del sistema, solo de dejar de mostrarlo en la app.

## Lo que se descartó / quedó pendiente

- **No se guardan favoritos localmente para "modo prueba"** (ej. en `AsyncStorage`, sin cuenta):
  se prefirió ser explícito sobre que hace falta una cuenta real, en vez de un favorito "fantasma"
  que se pierde al cerrar la app o cambiar de dispositivo, y que además no sincronizaría con la
  versión de escritorio/otro teléfono el día que exista.
- El conteo de negocios favoritos en Perfil no distingue archivados/despublicados que el vecino
  haya favoriteado antes de que el negocio se diera de baja — `FavoritosService.listar()` ya
  filtra por `estado = 'activo' AND archivado_en IS NULL`, así que esos simplemente no aparecen
  en la lista (el favorito queda huérfano en la tabla hasta que se borre en cascada si el
  negocio se elimina definitivamente).
