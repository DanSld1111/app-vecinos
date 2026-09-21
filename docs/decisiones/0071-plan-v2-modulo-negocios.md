# 0071 — Plan v2 del módulo de negocios

Ajustes sobre lo construido en [0065](0065-crud-productos-moneda-coordenada.md),
[0066](0066-edicion-sin-validacion.md), [0067](0067-ficha-negocio-panel.md),
[0068](0068-listado-negocios-completitud.md) y [0070](0070-rol-gestor-negocios.md), a partir
de una revisión del usuario tras usar el rol Gestor por primera vez. Seis cambios, decididos
con bocetos (canvas de diseño) antes de tocar código.

## 1 — Gestor de negocios: acotado a lo administrativo

La 0070 le había dado a `gestor_negocios` acceso completo a la ficha (info, horario, fotos,
productos, ofertas, publicar) — calcado de `super_admin`. Demasiado: el pedido real era
"un rol como un administrativo" que solo da de alta y conecta con el dueño.

**`NegociosService` pasa de un solo `verificarPropiedad()` a dos:**

- `verificarAccesoBasico()` — ver la ficha y editar información general. Incluye a
  `gestor_negocios`.
- `verificarGestionOperativa()` — horario, fotos, productos, ofertas, galería. Solo
  `super_admin` y el dueño asignado. **No** incluye a `gestor_negocios`.

En el panel, `FichaNegocio.tsx` filtra las pestañas visibles a `["info", "dueno"]` cuando
`cuenta.rol === "gestor_negocios"` — las demás ni se renderizan, no es solo un disabled visual.

`aprobar`/`despublicar`/`rechazar` en el controlador vuelven a `("validador_contenido",
"super_admin")` — la 0070 los había abierto también a gestor por error.

## 2 — CRUD completo: Archivar y Eliminar

Antes solo existía Crear/Leer/Editar/Despublicar. Dos acciones nuevas, deliberadamente
separadas y **sin papelera** (el usuario fue explícito: la papelera con recuperación es solo
de productos):

- **Archivar** (`archivado_en TIMESTAMPTZ`, migración
  [0018](../../infraestructura/migraciones/0018_archivar_negocio.sql)): reversible, saca el
  negocio del listado del panel y de toda lectura pública (`listar`, `obtenerPorId`, `buscar`
  ahora filtran `archivado_en IS NULL`), pero conserva la fila y su historial. `GET
  /negocios/admin?archivados=true` trae la vista "Ver archivados"; `PATCH :id/archivar` /
  `PATCH :id/restaurar-archivo` mueven la cuenta.
- **Eliminar** (`DELETE :id`): definitivo. Borra la fila de verdad; productos, categorías del
  negocio y reseñas se van en cascada (la migración 0018 también corrigió tres FK que hasta
  ahora tenían la acción por defecto de Postgres, NO ACTION, y hubieran bloqueado el borrado:
  `resenas` → CASCADE, `anuncios` → SET NULL, `pagos_transacciones` → CASCADE). También borra
  la foto principal, la galería y las fotos de cada producto de Supabase Storage. El panel pide
  confirmación explícita antes de llamarlo ("¿Eliminar 'X'? Esta acción no se puede deshacer").

Las dos quedan **exclusivas de `super_admin`** — ni gestor ni el dueño las ven, coherente con
el punto 1.

## 3 — Vincular dueño: confirmado que Gestor puede crear Y enlazar

El boceto había dejado esto como pregunta abierta; el usuario confirmó la opción más completa:
Gestor puede **crear** la cuenta del dueño (con contraseña temporal) o **enlazar** una que ya
existe — las dos, en el mismo flujo de la pestaña "Dueño".

Se abrieron tres puertas angostas en `CuentasController`, nunca el CRUD completo de cuentas:

- `POST /cuentas` — ahora acepta `gestor_negocios`, pero `CuentasService.crear()` rechaza con
  403 si `creadorRol === "gestor_negocios" && dto.rol !== "dueno_negocio"`. Un gestor no puede
  crear un validador o otro gestor a través de este endpoint.
- `GET /cuentas` — acepta `gestor_negocios`, pero el controlador fuerza `soloRol =
  "dueno_negocio"` server-side cuando quien pregunta es gestor. El cliente no puede pedir otra
  cosa.
- `PATCH` / `DELETE /cuentas/:id/negocios/:negocioId` (nuevos) — vincular/desvincular un
  negocio, y solo si la cuenta destino ya tiene `rol = "dueno_negocio"` (si no, 403). Reemplazó
  el viejo `agregarNegocio`/`quitarNegocio` del store, que hacía un `PUT /cuentas/:id` completo
  (nombre, correo, rol incluidos) — imposible de abrir a gestor sin exponer de más.

`PUT /cuentas/:id` (editar cualquier campo) y el resto del módulo Cuentas siguen siendo
exclusivos de `super_admin`.

## 4 — Listado: Boceto B + filtro por select

De los dos bocetos (A: lista aligerada, B: tarjetas con foto), el usuario eligió B — con un
agregado que no traía el boceto original: una barra de filtros completa (buscar, estado,
categoría, archivados), porque solo la foto grande sin forma de acotar se iba a volver
impráctica con más negocios.

`Negocios.tsx`: `.lista-negocios` (filas) → `.grid-negocios` (tarjetas, foto de 108px, barra de
progreso de completitud). El filtro de categoría pasó de una fila de chips a un `<select>` — con
14 categorías hoy, una fila de botones se amontona; un desplegable escala igual con 14 que con
40. Chip nuevo "📦 Ver archivados" alterna `cargarAdmin(token, true)`.

## 5 — Atributos de producto según categoría

Mecanismo nuevo, aprobado por el usuario como "borrador v1, ajustamos después":
`categorias.atributos_producto` (JSONB, migración
[0019](../../infraestructura/migraciones/0019_atributos_producto_por_categoria.sql)) define
por categoría una lista de `AtributoProductoDef` (`clave`, `etiqueta`, `tipo: "opciones" |
"texto"`, `opciones?`). `productos.atributos` (JSONB) guarda los valores elegidos.

`EditorProductosNegocio.tsx` calcula `atributosDef` a partir de la **primera** categoría del
negocio (`negocio.categoriaIds[0]`) — un negocio con varias categorías no combina plantillas,
la primera manda, igual que el resto del panel ya trata "la" categoría del negocio. `ModalProducto`
renderiza esos campos extra debajo de los de siempre (nombre/descripción/precio/foto), como
`<select>` u `<input>` según el tipo.

Categorías con atributos ya cargados: Moda (talla/color/género), Comida y Restaurantes
(porción/picante/vegetariano), Hogar (material/dimensiones/color), Mascotas (especie/tamaño),
Servicios/Consultorías/Salud/Otros servicios (duración/modalidad). El resto queda sin atributos
especiales — vacío es una respuesta válida, no una categoría a la que le falta algo.

No se construyó una UI de administración para editar estas plantillas — se ajustan por SQL
hasta que el usuario defina cambios concretos, que es lo que pidió ("yo te digo después qué
modificar").

## 6 — Alta de negocio reorganizada

`ModalNuevoNegocio` agrupa los mismos campos de siempre en 4 bloques con nombre: Identidad
(nombre, categoría), Ubicación (distrito, comunidad, dirección), Contacto (teléfono, WhatsApp —
opcional) y Dueño (el toggle que ya existía). Ninguna lógica cambió, solo la agrupación visual.

## Verificado en vivo (producción, con limpieza)

- Negocio de prueba en categoría Moda → el formulario de producto mostró Talla/Color/Género;
  guardado confirmado en `productos.atributos` vía consulta directa a la base.
- Archivar → "Ver archivados" lo mostró → Restaurar → volvió al listado normal. Ambos
  confirmados en `negocios.archivado_en` (columna a `now()` y de vuelta a `NULL`).
- Eliminar con confirmación → negocio y su producto de prueba, cero filas restantes
  (confirmado el borrado en cascada).
- Cuenta `gestor_negocios` de prueba: login → solo pestañas Información/Dueño en cualquier
  ficha → creó una cuenta "dueño de negocio" y la vinculó en un solo paso (confirmado
  `rol = 'dueno_negocio'` y el vínculo en `cuenta_negocios`) → 403 real al intentar desactivar
  una cuenta desde `/cuentas` ("Tu cuenta no tiene permiso para esta acción").
- Cuentas y negocios de prueba eliminados al terminar, incluidas sus filas de auditoría, sin
  dejar rastro en producción.
