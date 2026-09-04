# Panel de administrador — roles, validación y pantallas (definición, no implementado)

Este documento define el alcance del panel de administración web (`apps/admin`, aún no creada). Reutiliza los tipos de `paquetes/tipos` — mismo contrato que la app móvil. Revisión 2: agrega el rol de validación de contenido y el alcance multi-distrito, que faltaban en la primera versión.

## Por qué esta revisión

La primera versión (rev. 1) tenía dos huecos que el cliente señaló:

1. **Multi-distrito**: el piloto es San Borja, pero el modelo de datos ya está pensado para más de un distrito (`Departamento → Provincia → Distrito → Comunidad`, ver `docs/tecnica/04-modelo-de-datos.md`). El panel tiene que mostrar y filtrar por esa jerarquía desde ya, no asumir "todo es San Borja".
2. **Validación de contenido**: dejar que el super-admin apruebe cada negocio y cada aviso no escala — cuando haya varios distritos habrá varias juntas vecinales subiendo avisos y varios negocios subiendo su propia info. Se necesita un rol dedicado, separado de quien *publica* el contenido.

## Jerarquía geográfica (ya existe en el contrato, el panel solo la expone)

```
Departamento -> Provincia -> Distrito -> Comunidad
```

- `Negocio` ya tiene `distritoUbigeo` **y** `comunidadId` (`paquetes/tipos/src/negocio.ts:38-39`) — todo negocio ya sabe a qué distrito y comunidad pertenece, el dato no falta, falta exponerlo en el panel.
- `Aviso` tiene `comunidadId` (`paquetes/tipos/src/aviso.ts:5`) — su distrito se deriva de `Comunidad.distritoUbigeo`.
- **Regla para el panel**: en cualquier lista o formulario que involucre un negocio o un aviso, el distrito y la comunidad se muestran siempre juntos (selector en cascada: primero Distrito, luego Comunidad de ese distrito) y son filtros de primer nivel, no un campo escondido más.

## Roles (4, no 3)

| Rol | Qué hace | Alcance geográfico |
|---|---|---|
| **Super-admin** | Todo: distritos, comunidades, categorías, cuentas. Puede validar si hace falta, pero no es su trabajo diario. | Todos los distritos |
| **Dueño de negocio** | Edita su propio negocio. Cada cambio queda **pendiente de validación**, no se publica solo. | Su propio negocio únicamente |
| **Junta vecinal** *(antes "Moderador de avisos" — renombrado porque describe mejor el rol real: sube contenido, no lo modera)* | Redacta avisos para su distrito/comunidad. Cada aviso queda **pendiente de validación**. | Uno o más distritos/comunidades asignados por el super-admin (habrá una cuenta de junta vecinal por cada distrito que se sume) |
| **Validador de contenido** *(rol nuevo)* | Revisa la cola de negocios y avisos pendientes, y los aprueba o rechaza con un motivo. No crea contenido, solo lo valida. | Uno o más distritos asignados por el super-admin (así se puede repartir la carga cuando haya muchos distritos) |

**Por qué separar Validador de Junta vecinal y de Dueño de negocio**: si la misma persona que sube el aviso pudiera aprobarlo, la validación no sirve de nada. Y como habrá *varias* juntas vecinales (una por distrito), necesitas a alguien con visión de todas ellas para mantener un criterio de calidad consistente — ese es el validador.

## Flujo de validación (extiende el contrato existente, no lo reemplaza)

### Negocios — reutiliza `EstadoNegocio` que ya existe

`Negocio.estado` ya incluye `"por_verificar"` (`paquetes/tipos/src/negocio.ts:20`). Se reutiliza así:

1. El dueño crea o edita su negocio → `estado` pasa a `"por_verificar"` automáticamente (sin importar si es alta nueva o una edición sobre uno ya activo).
2. Mientras esté `"por_verificar"`, la app móvil **sigue mostrando la última versión aprobada** — no lo que el dueño acaba de escribir. *(Esto implica guardar la versión pendiente aparte de la publicada; ver "Pendiente técnico" abajo.)*
3. El validador lo aprueba (`estado` → `"activo"`, se llena `verificadoEn`) o lo rechaza (`estado` vuelve a `"activo"` si ya existía antes, o queda `"inactivo"` si es alta nueva; se llena `motivoRechazo`).
4. El dueño ve el motivo de rechazo en su propio panel y puede corregir y reenviar.

**Campos nuevos que hacen falta en `Negocio`** (no existen todavía, hay que agregarlos a `paquetes/tipos/src/negocio.ts`):
- `validadoPorCuentaId: string | null`
- `motivoRechazo: string | null`

### Avisos — hoy no tiene workflow, hay que agregarlo

`Aviso` hoy se publica tal cual, sin estado. Se agregan estos campos:
- `estado: "pendiente" | "publicado" | "rechazado"`
- `creadoPorCuentaId: string`
- `validadoPorCuentaId: string | null`
- `motivoRechazo: string | null`

Flujo: la junta vecinal crea con `estado: "pendiente"` → el validador aprueba (`"publicado"`, se llena `publicadoEn`) o rechaza (`"rechazado"`, se llena `motivoRechazo`) → la junta vecinal ve el estado y el motivo si fue rechazado.

### Pendiente técnico (a resolver antes de construir, no bloquea el boceto)

Guardar "lo publicado" y "lo pendiente" del mismo negocio como dos versiones separadas (para que la app móvil no muestre datos sin aprobar) es una decisión de modelo de datos para Etapa 2 (backend real) — con mocks no hace falta resolverlo todavía, pero queda anotado para no perderlo de vista.

## Ubicación en tiempo real del vecino (pregunta del cliente, 2026-08-27)

**Pregunta**: ¿no se puede usar la ubicación real del celular en vez de un punto fijo por comunidad?

**Respuesta**: sí, y es lo ideal a mediano plazo — pero no reemplaza a `Comunidad.centro`, lo complementa:

- **Con GPS real** (Etapa futura, requiere pedir permiso de ubicación con `expo-location` — ya se probó una vez en la extinta `PantallaBienvenida` y se quitó cuando se eliminó esa pantalla): la distancia sería exacta, vecino por vecino.
- **`Comunidad.centro` sigue haciendo falta como respaldo** para los casos en que el GPS real no aplica: el vecino no dio permiso, está en la versión web (sin GPS confiable), o la app widescale se autoexpande a un distrito donde el objetivo es simplemente que las tarjetas de negocio muestren un dato *razonable* en vez de romperse.
- **Recomendación**: cuando se agregue GPS real, la señal de origen queda así — `ubicación real del dispositivo` → si no está disponible → `Comunidad.centro` de la comunidad activa → si por algún motivo tampoco hay comunidad cargada, el respaldo genérico de Lima Centro (`CENTRO_RESPALDO` en `distancia.ts`, ya no específico de San Borja). Ahora mismo solo está implementado el segundo escalón; el GPS real queda pendiente como una funcionalidad aparte que vale la pena diseñar cuando se priorice (pide su propio flujo de permisos y estado "denegado").

## Novedades de la app (módulo nuevo)

Hoy "Novedades" (lo que se ve en la bandeja de Notificaciones bajo esa sección) es un array fijo en código: `apps/movil/src/datos/mock/novedades.mock.ts`, con un comentario que literalmente dice "se agrega una línea aquí cada vez que se lanza algo nuevo". En la práctica eso significa que **anunciar una función nueva a los vecinos requiere que un desarrollador edite el código y se vuelva a publicar la app** — no hay manera de que el equipo lo haga por su cuenta.

Convertirlo en un módulo del panel significa lo mismo que ya pasa con Avisos o Categorías: una pantalla tipo lista + formulario donde el super-admin escribe el título y el texto, le da guardar, y aparece en la bandeja de todos los vecinos al instante — sin tocar código ni esperar una nueva versión de la app.

```ts
export interface Novedad {
  id: string;
  titulo: string;
  texto: string;
  publicadoEn: string;
  activo: boolean;
}
```

Pantalla **Novedades** (super-admin): tabla (título, fecha de publicación, activo/oculto) + "+ Nueva novedad" (título, texto). No necesita validación de otro rol — es contenido oficial de la app, lo escribe el mismo equipo que la construye.

## `Cuenta` — tipo nuevo, no existe todavía

Hace falta un tipo para las cuentas de acceso al panel (hoy no hay ningún modelo de usuario/cuenta en `paquetes/tipos`):

```ts
export type RolCuenta = "super_admin" | "dueno_negocio" | "junta_vecinal" | "validador_contenido";

export interface Cuenta {
  id: string;
  nombre: string;
  correo: string;
  rol: RolCuenta;
  /** Solo si rol = "dueno_negocio". */
  negocioId: string | null;
  /** Solo si rol = "junta_vecinal" o "validador_contenido". Vacío = todos los distritos (poco común, normalmente 1-2). */
  distritosAsignados: string[];
  activo: boolean;
  creadoEn: string;
  ultimoAccesoEn: string | null;
}
```

## Pantallas — detalle campo por campo

### Compartidas
- **Login**: correo, contraseña.
- **Cambiar contraseña**: obligatoria en el primer ingreso (la credencial inicial la entrega el super-admin).

### 🛠️ Super-admin

**Dashboard**: negocios activos, negocios pendientes de validación, avisos pendientes de validación, distritos activos.

**Distritos y comunidades** (pantalla nueva, no estaba en rev. 1):
| Campo | Tipo | Notas |
|---|---|---|
| Distrito → nombre, ubigeo, activo | — | Alta de un distrito nuevo cuando se expande a otra zona |
| Comunidad → nombre, slug, distrito (selector), activo, fecha de lanzamiento | — | Una o más comunidades por distrito |
| Comunidad → **centro** (coordenada, lat/lng) | mapa/pin | **Ya implementado en el contrato** (`Comunidad.centro`, `paquetes/tipos/src/geografia.ts`) — hasta ahora la app calculaba "🚶 X min" contra una constante fija de San Borja; ya se corrigió para usar `Comunidad.centro` de la comunidad activa (`apps/movil/src/utilidades/distancia.ts`). El panel es lo único que falta para poder cargarlo cuando se sume un distrito nuevo. |
| Comunidad → **descripción** (texto libre) | textarea | **Ya implementado en el contrato** (`Comunidad.descripcion`) — alimenta la pantalla "Sobre tu comunidad" en Mi perfil (antes era un botón muerto con el nombre "San Borja" cableado a mano; ya se corrigió para leer `comunidad.descripcion` de la comunidad activa del vecino). |

**Categorías**: nombre, slug, ícono, orden, arquetipo de ficha (`menu`/`catalogo`/`servicios`/`categorias`/`ofertas`).

**Negocios** (tabla): filtros por **distrito → comunidad** (cascada, primero uno y luego el otro), categoría, estado. Columnas: nombre, distrito/comunidad, categoría, estado, verificado. Acción "Nuevo negocio" abre el mismo formulario de creación/edición.

**Nuevo negocio / Editar negocio** (formulario completo, todo campo real de `Negocio`):
| Campo | Tipo |
|---|---|
| Nombre, descripción | texto |
| Distrito → Comunidad | selector en cascada (obligatorio) |
| Categorías | multi-selector |
| Dirección, coordenada | texto + mapa |
| Teléfono, WhatsApp | texto (opcionales) |
| Horario | editor semanal (`Horarios`) |
| Foto principal, galería | subida de imagen |
| Contenido según arquetipo | Menú / Catálogo / Servicios / Rubros / Ofertas — según la categoría elegida |

Al guardar (lo cree el super-admin o lo edite el dueño), `estado` queda `"por_verificar"`.

**Cola de validación** (misma pantalla que usa el rol Validador — el super-admin puede acceder pero no es su tarea diaria): ver detalle en la sección del Validador.

**Cuentas**: tabla (nombre, correo, rol, distritos asignados, activo/inactivo, último acceso). Alta de cuenta: nombre, correo, rol — si el rol es `dueno_negocio`, selector de negocio; si es `junta_vecinal` o `validador_contenido`, selector múltiple de distritos.

**Publicidad** (módulo nuevo — responde a "¿dónde subo la publicidad de la app?"): hoy `Anuncio` (`apps/movil/src/datos/mock/anuncios.mock.ts`) es un mock mínimo (`id`, `nombre`, `detalle`, `colorFondo`) sin imagen, sin fechas y sin saber en qué pantalla aparece. Se muestra en dos lugares distintos de la app móvil: el carrusel de Inicio (`CarruselPublicidad.tsx`) y el banner de Buscar (`app/buscar.tsx`, "Banner de anuncio"). El panel necesita manejar ambos **espacios publicitarios** desde un solo lugar.

`Anuncio` se extiende así (campos nuevos, no existen todavía):
```ts
export type UbicacionAnuncio = "carrusel_inicio" | "banner_buscar";

export interface Anuncio {
  id: string;
  nombre: string;
  detalle: string;
  imagenUrl: string | null;
  /** En qué pantalla(s) de la app aparece — un mismo anuncio puede vivir en más de un espacio. */
  ubicaciones: UbicacionAnuncio[];
  /** Opcional: si se define, tocar el anuncio abre la ficha de este negocio en vez de no hacer nada. */
  negocioId: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  orden: number;
  activo: boolean;
}
```

Pantalla **Publicidad**: tabla (miniatura, nombre, dónde aparece, vigencia, estado — activo / programado / vencido). "+ Nuevo anuncio": nombre, detalle, imagen, dónde aparece (multi-selector de espacios), negocio vinculado (opcional), fecha inicio/fin, orden.

Este módulo lo gestiona el super-admin — es contenido comercial/curado de la app entera, no algo que cada negocio suba por su cuenta (evita que cualquiera se auto-promocione sin control).

### 🏪 Dueño de negocio
- **Mi negocio**: los mismos campos del formulario de arriba, pero sin el selector de distrito/comunidad (eso no lo puede cambiar el dueño — si un negocio cambia de dirección a otro distrito, lo reasigna el super-admin).
- **Horario**: editor semanal completo, un control por día (`DiaSemana`: abierto/cerrado + hora de apertura/cierre).
- **Fotos**: foto principal + galería, con subir/quitar.
- **Contenido según arquetipo**: ver sección de arriba.
- **Ofertas activas**: lista de `OfertaNegocio` (nombre, precio, precio original opcional para el tachado, etiqueta) + alta/edición/pausa.
- **Estado de mi negocio** (pantalla nueva): muestra si está `Activo`, `Por verificar` (con fecha de envío) o si la última edición fue rechazada (con el motivo, para poder corregir y reenviar).

### 🏘️ Junta vecinal
- **Mis avisos**: lista de sus propios avisos con estado (`Pendiente` / `Publicado` / `Rechazado`, con motivo si fue rechazado).
- **Nuevo aviso**: categoría (`municipal`/`junta_vecinal`/`seguridad`/`otro`), título, cuerpo, imagen opcional, comunidad (si la cuenta tiene más de un distrito/comunidad asignado, elige a cuál pertenece este aviso).

### ✅ Validador de contenido
- **Cola de validación** (pantalla central de este rol): lista unificada de negocios y avisos en estado pendiente, filtrable por distrito y por tipo (negocio/aviso). Cada ítem se abre en un panel de revisión con el contenido completo y dos acciones: **Aprobar** o **Rechazar** (obliga a escribir un motivo si rechaza).
- **Historial de validaciones**: tabla (ítem, tipo, acción tomada, motivo si rechazó, fecha) — para tener trazabilidad de quién aprobó qué.

## Auditoría contra la app móvil (2026-08-27) — roadmap mapeado

Se revisó toda la app móvil contra este documento para encontrar contenido que un vecino ve pero que ningún módulo del panel gestiona. Aparte de los 3 huecos reales de arriba (ya resueltos), esto es lo que existe hoy como **"Próximamente"** en la app — sin modelo de datos ni pantalla de administración, porque la función en sí todavía no está construida. Se deja mapeado para que quede claro qué módulo de panel le tocaría a cada uno **cuando** se decida construirlo — no es trabajo para ahora.

### 🩺 Directorio de profesionales
- **Estado actual**: el tipo `Profesional` ya existe en `paquetes/tipos/src/profesional.ts` (médico/veterinario/legal-contable, con `colegiaturaNumero`, `colegiaturaEntidad`, `colegiaturaVerificadaEn`) pero **no se usa en ninguna pantalla de la app todavía** — es un contrato sin función construida encima.
- **Módulo de panel que le tocaría**: uno nuevo, "Profesionales", muy parecido a Negocios pero con un paso de verificación específico (confirmar el número de colegiatura contra el colegio profesional correspondiente) — el Validador de contenido sería quien lo revise, con un campo adicional de "colegiatura verificada" además de aprobar/rechazar.
- **Pantallas móviles que dependerían de esto**: una guía de profesionales dentro de Servicios (hoy no existe).

### ⭐ Reseñas
- **Estado actual**: "Próximamente" en Mi perfil (`app/(tabs)/perfil.tsx`), sin ningún campo de calificación en `Negocio` ni pantalla de reseñas en la ficha del negocio.
- **Módulo de panel que le tocaría**: no es contenido que el panel *cree* — son los vecinos quienes reseñan. Al super-admin/validador le tocaría, más bien, un módulo de **moderación de reseñas** (reportar/ocultar reseñas ofensivas o falsas), parecido en espíritu a la Cola de validación pero reactivo (solo entra si alguien reporta algo).
- **Requiere primero**: sistema de cuentas de vecino (login real, ya diseñado en `FlujoLogin.tsx` pero sin backend) — sin eso no hay quién firme una reseña.

### ❤️ Favoritos
- **Estado actual**: "Próximamente" en Mi perfil, sin relación vecino↔negocio en el contrato.
- **Módulo de panel**: ninguno — es una preferencia 100% del vecino, el panel no necesita gestionar "quién marcó qué como favorito". Solo requiere el sistema de cuentas de vecino (mismo prerrequisito que Reseñas) para poder guardarlo por usuario en vez de solo en el dispositivo.

### 🐾 Perdidos y encontrados
- **Estado actual**: chip de filtro "Perdidos" en Comunidad (`app/(tabs)/comunidad.tsx`) marcado "Próximamente", sin modelo de datos — hoy `CategoriaAviso` no incluye este tipo.
- **Módulo de panel que le tocaría**: podría vivir dentro del mismo módulo de Avisos (agregar `"perdido"` a `CategoriaAviso`) o como su propio tipo `ObjetoPerdido` (nombre de la mascota/objeto, foto, última ubicación vista, contacto) si se quiere un formulario más específico que un aviso genérico. Cualquiera de los dos reutiliza el mismo flujo de validación que ya tienen los avisos (para evitar publicaciones falsas o de mal gusto).
- **Quién lo subiría**: sería el propio vecino, no la junta vecinal — esto es una diferencia importante: significa un rol adicional ("Vecino" con permiso de publicar, no solo consumir) que hoy no existe en el panel.

### 🧭 Los 8 servicios futuros del catálogo de Servicios
Verbatim de `app/(tabs)/servicios/index.tsx`, sección "Próximamente": Rescate animal, Turismo, Inmobiliaria, Taxi, Consultorías, Bolsa de empleo, Bolsa de puntos, Otros servicios. Ninguno tiene tipo, mock ni pantalla — son solo un nombre + ícono en un arreglo. Mapeo preliminar de qué le tocaría a cada uno si se prioriza:

| Servicio | Se parece más a... | Módulo de panel probable |
|---|---|---|
| Rescate animal | Aviso especializado (casos activos) | Extensión de Avisos, con validación |
| Turismo | Negocio (agencias, tours) | Reutiliza el módulo Negocios tal cual |
| Inmobiliaria | Negocio + un tipo de "ficha" nuevo (inmuebles en alquiler/venta) | Negocios + arquetipo de ficha nuevo (`inmuebles`) |
| Taxi | Cuenta de conductor + verificación de licencia | Módulo nuevo, parecido a Profesionales |
| Consultorías | Profesional (ver arriba) | Mismo módulo que Profesionales |
| Bolsa de empleo | Entidad nueva (`OfertaEmpleo`): puesto, negocio, requisitos | Módulo nuevo, con validación |
| Bolsa de puntos | Sistema de fidelización — no es "contenido", es lógica de negocio (acumulación/canje) | Fuera del alcance de un panel de contenido; sería su propio subsistema |
| Otros servicios | Cajón de sastre — depende de qué caiga aquí en la práctica | Se define cuando aparezca el primer caso real |

Ninguno de estos bloquea nada de lo ya diseñado — el panel actual (roles, validación, multi-distrito) está armado para poder sumar cualquiera de estos como un módulo más el día que se prioricen, sin rediseñar lo que ya existe.

## Fuera de alcance (por ahora)

- Auto-registro de negocios con flujo de aprobación (el super-admin sigue dando de alta manualmente).
- Pagos o planes de suscripción para negocios.
- Versionado completo de "publicado vs. pendiente" a nivel de base de datos (ver "Pendiente técnico" arriba) — se resuelve al construir el backend real de Etapa 2.
- Analíticas/reportes más allá del resumen del dashboard.

## Estado de la construcción (`apps/admin`)

App nueva en el monorepo: Vite + React + TypeScript + React Router + Zustand, reutilizando `@app-vecinos/tipos`. Corre con `npm run dev --workspace=apps/admin` (puerto 5183).

**Ya funciona de verdad** (no es boceto, es código real con datos mock interactivos):
- Login con las 4 cuentas de prueba, una por rol.
- Sidebar dinámico: cada rol ve solo sus módulos; el contador de "Validación" respeta el alcance geográfico de la cuenta (`Cuenta.distritosAsignados`).
- Dashboard con estadísticas reales calculadas desde los datos.
- Negocios: tabla con buscador y filtro por categoría.
- **Cola de validación**: lista unificada de negocios y avisos pendientes (filtrable por tipo), panel de revisión con Aprobar/Rechazar — rechazar exige motivo. Al aprobar o rechazar, el ítem sale de la cola al instante y el contador del sidebar baja en vivo.
- **Historial de validaciones**: tabla de todo lo ya aprobado/rechazado, con motivo y fecha.

**El panel de Super-admin ya está completo** — todos sus módulos funcionan de verdad, no son boceto:
- **Distritos y comunidades**: árbol distrito → comunidades, alta de ambos.
- **Categorías**: tabla + alta con selector de arquetipo de ficha.
- **Publicidad**: tabla con estado de vigencia calculado (Activo/Programado/Vencido), pausar/reactivar, alta con selector múltiple de espacios (`carrusel_inicio`/`banner_buscar`) y negocio vinculado opcional.
- **Novedades**: lista + publicar, ocultar/mostrar.
- **Cuentas**: tabla con alcance por rol, alta con campos condicionales (negocio si es dueño, distritos asignados si es junta vecinal o validador).

**Todavía no construido** (roles Dueño de negocio y Junta vecinal): Mi negocio y sus pestañas (Horario, Fotos, Ofertas, Estado), Mis avisos.

## Bocetos publicados

Tres tandas de bocetos, todos en `docs/diseno/` como copia congelada además de vivir en la cuenta de Claude:

1. **General** (`14-panel-admin-general.html`): Login, Dashboard, Negocios (tabla), Mi negocio (formulario con pestañas), Contenido según arquetipo (ejemplo Menú), Avisos.
2. **Detalle y validación** (`15-panel-admin-detalle-validacion.html`): Distritos y comunidades, Nuevo negocio (formulario completo con distrito→comunidad), Cola de validación, Cuentas (con alcance geográfico), Mis avisos con motivo de rechazo.
3. **Módulos restantes** (`16-panel-admin-modulos-restantes.html`): Cambiar contraseña, Categorías (CRUD), Publicidad (CRUD, los dos espacios publicitarios), Historial de validaciones, Horario (dueño), Fotos (dueño), Ofertas activas (dueño), Estado de mi negocio, Nuevo aviso (junta vecinal, pantalla completa), Novedades (CRUD, changelog de la app).

Con esto los 4 roles + login tienen boceto de cada pantalla listada arriba. Siguiente paso real: crear `apps/admin` y empezar por Login + Dashboard + Negocios (lo que más se usa a diario).
