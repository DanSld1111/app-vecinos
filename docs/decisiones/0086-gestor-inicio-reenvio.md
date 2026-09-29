# 0086 — Inicio del gestor, reenvío tras rechazo, alcance por distrito e historial

## Contexto

El rol `gestor_negocios` podía registrar y editar negocios, pero:

1. Un negocio rechazado quedaba `inactivo` sin forma de volver a la cola del validador.
2. Entraba directo a la lista de negocios, sin un resumen de lo pendiente.
3. Veía y editaba negocios de todos los distritos.
4. Podía abrir por URL secciones que no son de su rol.
5. No había forma de saber quién cambió qué en un negocio.

## Decisión

- **Reenviar a revisión** (`PATCH /negocios/:id/reenviar`, con nota opcional de hasta 500 caracteres). Solo aplica a
  negocios `inactivo` con `motivo_rechazo`. Al rechazar se guarda una foto de la ficha (`version_rechazada`), así el
  modal de reenvío y la cola del validador muestran "antes → ahora". Aprobar limpia la foto y la nota.
- **Inicio del gestor** (`/inicio`): cifras que filtran (en sus distritos, rechazados, en revisión, ficha incompleta),
  "Necesitan tu atención" con reenviar/corregir/completar, "Esperando revisión" y "Actividad reciente"
  (`GET /negocios/actividad`). El menú muestra el número de rechazados.
- **Alcance por distrito**: el gestor puede tener `distritos_asignados` (se editan en Cuentas). Sin distritos asignados
  trabaja en todos. La API filtra la lista y rechaza con 403 cualquier acción fuera de su alcance. Registrar negocio
  solo ofrece sus distritos.
- **Rutas por rol**: el panel redirige al inicio del rol, con un aviso, cualquier ruta que ese rol no usa. La API sigue
  siendo la que protege los datos; esto es para no mostrar pantallas vacías o con errores.
- **Historial** (pestaña 🧾 en la ficha, `GET /negocios/:id/historial`): la auditoría del negocio y de sus productos,
  las 60 más recientes. Se empezaron a auditar horario, ofertas, fotos y el alta del negocio; lo anterior solo aparece
  si ya se registraba.

Migración: `0030_reenvio_negocio.sql` (`version_rechazada`, `nota_reenvio`, `creado_por_cuenta_id` e índice para
buscar la auditoría de productos por negocio).
