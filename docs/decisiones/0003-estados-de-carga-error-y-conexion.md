# 0003 - Estados de carga, error y sin conexión (cierre de Etapa 1)

Fecha: 2026-08-26
Estado: aceptada

## Contexto

El plan de Etapa 1 (sección 12 del documento maestro) exige "estados de carga, error, sin resultados, sin conexión" en toda la interfaz. Ya existía el estado "sin resultados" (`EstadoVacio`); faltaban los otros tres.

## Decisión

- **Carga**: `EsqueletoNegocio` / `EsqueletoListaNegocios` — bloques con animación de pulso que imitan la forma de una tarjeta de negocio, en vez de un texto "Cargando…".
- **Error**: `EstadoError` — ícono, mensaje y botón "Reintentar" que llama a `refetch()` de TanStack Query. Se conectó en Inicio, `GuiaListado`, Mapa, ficha de negocio e Información local.
- **Sin conexión**: `useConectividad` (envuelve `@react-native-community/netinfo`) + `BannerSinConexion`, montado una sola vez en `app/_layout.tsx` para que aparezca sobre cualquier pantalla.

## Hallazgo durante las pruebas

Al simular el evento `offline` del navegador para probar el banner, **todas las consultas nuevas dejaron de resolver datos** (mostraban "sin resultados" en vez de cargar). Causa: TanStack Query, por defecto, pausa las consultas cuando `navigator.onLine` es `false` (pensado para llamadas HTTP reales). Nuestros datos de Etapa 1 son 100% locales (mock, con un `setTimeout` simulado) — no hay ninguna razón para pausarlos por falta de red.

## Decisión técnica derivada

Se configuró `networkMode: "always"` en `src/datos/queryClient.ts` para todas las queries. Esto es correcto mientras la fuente de datos sea mock. **Revisar en Etapa 2**: cuando `fabricaRepositorios.ts` empiece a usar la implementación real (`EXPO_PUBLIC_DATA_SOURCE=api`), evaluar si conviene volver a `networkMode: "online"` (comportamiento por defecto) para que las llamadas HTTP reales sí respeten el estado de conexión del dispositivo.

## Consecuencias

- Se gana: la app nunca muestra "sin resultados" por error cuando en realidad los datos están disponibles localmente.
- Queda pendiente: re-evaluar `networkMode` al conectar la API real, y decidir si el banner de "sin conexión" debe bloquear acciones (como escribir por WhatsApp) o solo informar, como hace hoy.
