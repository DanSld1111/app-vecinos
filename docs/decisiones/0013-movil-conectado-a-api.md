# 0013 — `apps/movil` conectado a la API real (Etapa 3, primer corte)

## Contexto

Con Etapa 2 cerrada ([0012](0012-cierre-etapa-2-profesionales.md)), tocaba el primer paso real de
Etapa 3: implementar `apps/movil/src/datos/api/*`, que hasta ahora solo tiraba
`Error("Implementación de API pendiente")`. La capa de repositorios (`contratos/`,
`fabricaRepositorios.ts`) ya estaba diseñada desde Etapa 0 exactamente para este momento — el
trabajo fue implementar el lado que faltaba, no rediseñar nada.

## Decisiones

**Un archivo `api/repositorioX.api.ts` por cada `mock/repositorioX.mock.ts` existente**, mismo
nombre de clase con sufijo `Api`, implementando la misma interfaz de `contratos/`. Ningún cambio a
los contratos ni a los hooks (`datos/hooks/useX.ts`) ni a las pantallas — es exactamente el punto
del patrón repositorio: la UI nunca se entera de qué lado del switch está.

**`RepositorioAvisosApi.listarPorComunidad` pide una sola página con límite alto (50)**, aunque el
contrato original es un array plano (heredado de cuando todo era mock, sin paginación). El backend
sí pagina de verdad (regla general de la API). Documentado en el propio archivo como una
simplificación temporal: el día que la pantalla de Comunidad implemente "cargar más", ese método
cambia de firma para exponer el cursor — hasta entonces, esto reproduce fielmente lo que la UI ya
pinta hoy (todos los avisos de la comunidad en una lista).

**`fabricaRepositorios.ts` decide una sola vez** (`const esApi = entorno.fuenteDeDatos === "api"`)
en vez de repetir el `if` en cada función — mismo resultado, menos ruido.

**El valor por defecto de `EXPO_PUBLIC_DATA_SOURCE` sigue siendo `mock`.** Se probó `api` de
verdad (ver "Validado en vivo" abajo) pero no se dejó activado por defecto — cambiar el default
global rompería la app para cualquiera que no tenga `apps/api` + Postgres corriendo localmente.
Activar el modo real es un `.env.local` con `EXPO_PUBLIC_DATA_SOURCE=api` (ver
`apps/movil/.env.example`, nuevo).

## Validado en vivo

Con `apps/api` corriendo contra la base real y `EXPO_PUBLIC_DATA_SOURCE=api`: la pantalla Inicio
cargó categorías, negocios y el aviso real de San Borja ("Corte de agua programado"); el selector
de comunidad mostró las 4 comunidades reales; cambiar a Miraflores mostró correctamente el estado
vacío "No encontramos negocios con ese filtro" porque el único negocio de Miraflores en la semilla
está `por_verificar` (no `activo`) — el mismo comportamiento correcto que ya se había probado por
API directamente en [0009](0009-validacion-en-vivo.md), ahora confirmado a través de la UI real.

## Qué queda para continuar Etapa 3

- Conectar el resto de `apps/admin` (`Negocios.tsx`, `Avisos.tsx`, `Cuentas.tsx`, páginas de
  geografía/categorías/plantillas/arquetipos) — hoy solo `Login`/`useSesionAdmin` y
  `Usuarios`/`useUsuarios` son reales ([0011](0011-recuperacion-de-clave.md)).
- `apps/movil`: falta el lado de escritura (crear negocio, enviar aviso) — hoy la capa de
  repositorios solo cubre lecturas, que es todo lo que la app del vecino necesita, pero el panel
  admin sí necesita mutar.
- Cargar el directorio real de negocios de San Borja (hoy son datos de ejemplo).
