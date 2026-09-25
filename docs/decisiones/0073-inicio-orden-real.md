# 0073 — Inicio: orden real por distancia y visitas, no por fecha de alta

## Contexto

La pantalla Inicio tenía dos secciones separadas, "El más visitado esta semana" y "Cerca de
ti", con nombres que prometían un orden que el backend no calculaba: `listar()` ordenaba
siempre por `n.creado_en DESC` (el negocio más nuevo primero). Los "minutos caminando" que se
mostraban tampoco venían de la ubicación real del vecino, sino de una aproximación en línea
recta desde el centro fijo de la comunidad (`Comunidad.centro`). El resultado: dos secciones
casi idénticas, sin relación real con visitas ni con dónde está parado el vecino — puro aire
visual y una promesa incumplida.

## Decisión

- **Una sola tabla de eventos**, `negocio_visitas` (migración 0022): un renglón por apertura de
  ficha, público (sin cuenta) — `POST /negocios/:id/visitas`. `negocios.mapeo.ts` cuenta los
  últimos 7 días con una subconsulta correlacionada (`visitas_7d`) y la expone en todo `Negocio`
  como `visitas7d`.
- **`GET /negocios` acepta `lat`/`lng` reales del dispositivo.** Con ellos: ordena por
  `ST_Distance` real (PostGIS) con un tope de 6 km (`DISTANCIA_MAXIMA_METROS` en
  `negocios.service.ts`) — un negocio de otro distrito, o un error de GPS, no debe aparecer en
  "Cerca de ti" aunque tenga muchas visitas. Sin `lat`/`lng`: cae a `visitas_7d DESC` — nunca al
  azar, nunca por fecha de alta. Cada `Negocio` de esa respuesta trae `distanciaM` cuando
  aplicó.
- **Una sola sección en Inicio** ("Cerca de ti") reemplaza a las dos anteriores — ver
  `app/(tabs)/index.tsx`. El badge "🔥 Popular" (`TarjetaNegocio`) es del único negocio con más
  `visitas7d` (siempre que sea mayor a 0), no del primero de una lista sin ordenar.
- **Ubicación real, con caché de 5 minutos** (`useUbicacionUsuario.ts`, Zustand): pide permiso
  al entrar a Inicio, guarda la coordenada y no vuelve a llamar al GPS si la anterior tiene
  menos de `VIGENCIA_MS`. Si el vecino niega el permiso (o falla el GPS), un pie de página fijo
  al fondo de Inicio explica que se ordena por popularidad y se usa el centro del distrito —
  nunca se bloquea la pantalla ni se pide el permiso a la fuerza.
- **Se quitó la palabra "Categorías"** como encabezado — la fila de fotos ya se explica sola.
- Se apretó el espaciado general de Inicio (gap de sección `espaciado.sm` → `espaciado.xs`) y se
  agrandaron los íconos de categoría (60→64/72→80px según variante) y la tarjeta de avisos
  (96→112px, insignia 36→48px) — quedaban chicos, y con solo una sección de negocios en vez de
  dos sobraba menos aire para compensar.

## Lo que se descartó

- **Ordenar server-side sin GPS por "cercanía estimada" a la comunidad**: ya existía
  (`Comunidad.centro`) y es justo lo que se reemplaza — no aporta nada sobre ordenar por
  popularidad real cuando no hay ubicación.
- **Visitas acumuladas de siempre** en vez de una ventana de 7 días: un negocio viejo con
  ventaja acumulada quedaría "Popular" para siempre, sin reflejar lo que pasa ahora. Ver
  propuesta pendiente abajo si se quiere afinar más.

## Pendiente / no incluido en esta iteración

- Un tope de distancia configurable por comunidad (hoy es un número fijo, 6 km, razonable para
  un distrito como San Borja pero no necesariamente para una comunidad rural más dispersa).
- Recordar la ubicación entre sesiones (hoy la caché de 5 minutos vive solo en memoria — se
  vuelve a pedir el GPS cada vez que se abre la app desde cero).
- Combinar el carrusel de avisos y el de publicidad en uno solo si con el tiempo hay pocos
  avisos reales.
