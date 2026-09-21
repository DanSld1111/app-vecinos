# 0065 — CRUD de productos, moneda del negocio y coordenada editable

Fase 1 del rediseño del módulo de negocios del panel (ver conversación de bocetos: listado,
ficha con pestañas, alta rápida, productos). Esta decisión cubre solo la base de datos y la API;
las fases siguientes son de interfaz.

## Contexto

Al revisar el módulo de negocios para agregar "registrar negocios y alimentarlos con fotos,
horario, dirección y todos sus atributos", aparecieron tres huecos que no eran evidentes:

1. **No existía forma de crear productos.** La API solo sabía *listar* los productos de un
   negocio y *cambiarle la foto* a uno que ya existiera. Los productos que se ven hoy en la app
   entraron por carga de datos directa a la base — ni el panel ni la cuenta del dueño podían
   agregar uno.
2. **La moneda no existía como concepto.** El `S/` estaba escrito a mano en 6 lugares distintos
   del código (4 en la app, 2 en el panel).
3. **La ubicación de un negocio creado desde el panel era falsa.** `crear()` le asignaba el
   centro de la comunidad, y `actualizarInfo()` no tocaba la coordenada — así que todos los
   negocios cargados desde el panel quedaban clavados en el mismo punto, sin forma de
   corregirlo. Eso afecta el "🚶 9 min caminando" y el mini-mapa de la ficha en la app.

## Decisiones

### Moneda a nivel de negocio, no de cada precio

Un negocio cobra todo en la misma moneda. Ponerla en el negocio significa elegirla una vez y que
aplique a sus productos, ofertas y servicios; ponerla por producto obligaría a elegirla en cada
fila y dejaría que una misma carta mezcle soles y dólares sin querer. `PEN` por defecto (el
piloto es San Borja); `USD` y `EUR` disponibles.

`formatearPrecio()` vive en `paquetes/tipos/src/comun.ts` — un solo lugar donde se decide cómo se
escribe un precio, para reemplazar en la Fase 4 las 6 copias con `S/` escrito a mano.

### Papelera sin purga automática

Los productos eliminados van a una papelera (`eliminado_en`) desde donde se pueden restaurar.
**No hay borrado automático por tiempo**: la primera versión del plan contemplaba vaciarla a las
48 horas, y el usuario pidió expresamente quitarlo. Se vacía solo cuando alguien elimina
definitivamente — ese es el único borrado real, y es el que también borra la foto del producto de
Supabase Storage (si no, las fotos quedarían huérfanas para siempre).

Nota de implementación que motivó parte de esa decisión: una purga automática programada tampoco
habría sido confiable acá, porque la API vive en el plan gratuito de Render y se duerme tras 15
minutos sin tráfico (ver [decisión 0051](0051-fix-rate-limit-sin-trust-proxy.md) sobre el mismo
entorno).

### Orden manual de productos

Campo `orden` por producto. Se ordena `categoria_menu, orden, nombre`: las secciones quedan
alfabéticas, los productos dentro de cada una en el orden que fije el dueño arrastrando, y
`nombre` solo desempata productos que nunca se reordenaron. Al crear, el producto entra al final
de su sección; si se lo mueve a otra sección, también va al final de la nueva (su posición
anterior no significa nada en otra lista).

`PUT :id/productos/orden` recibe **la lista completa de ids en el orden final**, no un "subir
uno": mandar la lista entera es lo que evita que dos ediciones simultáneas dejen el orden
inconsistente.

### Quién puede editar

Se reutiliza `verificarPropiedad()`, que ya existía: pasa el `super_admin` (cualquier negocio) y
el `dueno_negocio` asignado a ese negocio. Eso cubre el requisito de que ambos puedan gestionar
los productos, sin lógica nueva de permisos.

## Endpoints nuevos

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `:id/productos` | Crear |
| `PUT` | `:id/productos/:productoId` | Editar |
| `PUT` | `:id/productos/orden` | Reordenar (lista completa de ids) |
| `DELETE` | `:id/productos/:productoId` | A la papelera (recuperable) |
| `PATCH` | `:id/productos/:productoId/restaurar` | Sacar de la papelera |
| `DELETE` | `:id/productos/:productoId/definitivo` | Borrado real + foto en Storage |
| `GET` | `:id/productos/papelera` | Ver la papelera de ese negocio |
| `DELETE` | `:id/productos/:productoId/foto` | Quitar la foto sin borrar el producto |

Las rutas literales (`papelera`, `orden`) van declaradas **antes** que las de `:productoId` — si
no, Nest las tomaría como si fueran ids.

`PUT :id/info` ahora acepta además `coordenada` y `moneda`, ambos opcionales: si no vienen, se
deja lo que ya había.

## Validado contra el servidor real

22 comprobaciones sobre la API en producción: crear, editar, reordenar (el segundo producto
pasa a primero), mover a papelera, confirmar que un producto en papelera **desaparece de la
carta pública pero sí aparece en la papelera**, restaurar, eliminar definitivamente, cambiar
moneda y corregir coordenada. Al terminar, la carta volvió a tener los mismos 4 productos del
inicio y la papelera quedó vacía.

## Hallazgo para la Fase 2: editar desmonta el negocio de la app

Durante esa prueba, editar la información mandando **una** categoría a un negocio que tenía
**dos** lo devolvió a `por_verificar` — y como `obtenerPorId()` filtra por `estado = 'activo'`,
el negocio **desapareció de la app pública** hasta volver a aprobarlo (se restauró todo de
inmediato: categorías, teléfono, WhatsApp, coordenada y estado activo).

Eso no es un bug: `actualizarInfo()` considera "cambio sensible" tocar nombre, dirección o
categorías, y lo manda a revisión a propósito. Tiene todo el sentido cuando quien edita es el
**dueño** del negocio. Pero cuando quien edita es un **super_admin** desde el panel, dar de baja
la ficha sin avisar es sorprendente: el admin es justamente quien aprueba. Al construir el editor
de ficha de la Fase 2 hay que resolverlo — avisar claramente antes de guardar, o no aplicar la
regla cuando edita un super_admin.
