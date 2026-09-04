# 0004 - Reorganización de navegación: de 5 a 4 pestañas

Fecha: 2026-08-27
Estado: aceptada

## Contexto

Al crecer el catálogo de servicios (Buscar con 4 guías, Servicios con solo un ítem activo, Mapa como pestaña separada), el cliente notó que "Buscar" y "Servicios" competían por el mismo trabajo, y cuestionó si Mapa merecía un espacio fijo en la barra de navegación. Se hizo un boceto de diseño (ver artifact "Reorganización App Vecinos") antes de tocar código, evaluando alternativas.

## Decisión

Se aplicó la siguiente arquitectura de navegación:

- **Inicio**: vitrina curada. Incorpora la barra de búsqueda arriba (en vez de una pestaña "Buscar") y la campana de notificaciones.
- **Servicios**: catálogo completo de la app, ahora con su propia pila (`Stack`) interna. Absorbe las 4 guías que antes vivían bajo la pestaña "Buscar" (`negocios`, `productos`, `restaurantes`, `supermarket`), organizadas en "Disponible ahora" y "Próximamente".
- **Comunidad** (nueva): feed de avisos con filtro por categoría (Todo, Avisos, Seguridad, Reseñas, Perdidos). Absorbe lo que antes era "Información local". Reseñas y Perdidos y encontrados quedan como categorías visibles pero sin datos todavía (muestran "Próximamente") — no se fabricó contenido falso para esas dos.
- **Perfil**: se mantiene, ampliado con contador de reseñas/favoritos (en 0, sin sistema de favoritos real todavía), preferencias (notificaciones, modo oscuro) y "Invitar a vecinos" (usa la API `Share` nativa).
- **Mapa**: eliminado de la navegación principal. No se reemplazó por un botón "Ver en mapa" — se retira del alcance hasta que haya una razón concreta para reintroducirlo.
- **Buscar**: ya no es pestaña. Es una ruta de pantalla completa (`app/buscar.tsx`, `presentation: "fullScreenModal"`) que se abre desde la barra de Inicio. Muestra resultados en vivo mientras se escribe; vacío, muestra búsquedas recientes (en memoria, sin persistir), un carrusel de publicidad y búsquedas en tendencia (estáticas por ahora).

## Alternativas consideradas

Se evaluaron 4 estructuras de barra (documentadas en el boceto): mantener 5 pestañas, fusionar Buscar en Servicios, subir Comunidad como protagonista, y sacar Mapa de la navegación. Se terminó combinando la segunda y la tercera: Buscar se fusiona (pero vive en Inicio, no en Servicios, por pedido explícito del cliente), y Comunidad sube a pestaña propia.

## Consecuencias

- Se gana: cada pestaña tiene un trabajo único y sin superposición; el catálogo completo vive en un solo lugar (Servicios).
- Se pierde: acceso de un toque al mapa (ya no existe en la navegación).
- Queda pendiente: el permiso de notificaciones solo maneja el estado de UI (con Zustand, no persiste entre reinicios de la app) — la entrega real de notificaciones push requiere backend (Etapa 2) y la librería `expo-notifications`, no incluida todavía. "Modo oscuro" es un control visual sin efecto real: falta una pasada completa de tokens de color por tema antes de activarlo.
