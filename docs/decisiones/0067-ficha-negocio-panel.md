# 0067 — Ficha completa del negocio en el panel

Fase 2 del rediseño del módulo de negocios. La Fase 1 está en la
[decisión 0065](0065-crud-productos-moneda-coordenada.md).

## Contexto

En el panel, hacer clic en un negocio abría un panel lateral de **solo lectura**, con un botón
"Editar ficha completa → (próximamente)" deshabilitado y este título: *"El editor completo de
ficha (horario, fotos, ofertas) todavía no está construido"*.

Pero sí estaba construido — solo que para el **dueño**: las páginas `MiNegocio*` ya tenían los
editores de información, horario, fotos, ofertas y estado. Lo que faltaba era que el admin
pudiera usarlos sobre cualquier negocio.

## Decisión: un solo editor, dos contextos

Los editores se extrajeron a `apps/admin/src/componentes/negocio/` y ahora los usan **las dos**
pantallas:

- `/mi-negocio/*` — el dueño edita el suyo (encabezado "Mi negocio" + sus pestañas)
- `/negocios/:id` — el admin edita cualquiera (migas de pan + pestañas propias)

Las páginas quedaron como envoltorios de pocas líneas: lo único que cambia entre los dos
contextos es el encabezado y la navegación; el formulario es literalmente el mismo componente.
Eso evita que las dos versiones se separen con el tiempo (ya venía pasando: el panel del admin
mostraba menos datos que la pantalla del dueño).

El botón de guardar se movió del encabezado al pie de cada formulario, que es lo que permite que
el editor sea autónomo y no dependa de la barra superior de la página que lo contiene.

## Ubicación: mapa **y** coordenadas a mano

`SelectorUbicacion` combina las dos formas, sincronizadas: arrastrar el pin (o hacer clic en el
mapa) actualiza los números, y pegar coordenadas mueve el pin. El campo de pegado acepta el
formato tal cual se copia de Google Maps (`-12.1041, -77.0002`).

**Leaflet + OpenStreetMap, no Google Maps**: no necesita clave de API ni cuenta de facturación.
Los íconos por defecto de Leaflet se cargan por rutas relativas que Vite no resuelve, así que el
pin se dibuja con CSS (`divIcon`) en vez de depender de esos archivos.

## Pestañas nuevas del admin

- **Dueño** — crear o vincular la cuenta del dueño. Antes vivía en el panel lateral; al
  eliminarlo, se mudó acá.
- **Estado** — publicar el negocio ("Publicar en la app"). Antes solo se podía desde la Cola de
  validación, que es una pantalla aparte y sin el contexto de la ficha.

## Endpoint nuevo

`GET /negocios/:id/admin` — como el público, pero sin filtrar por estado. La ficha del panel
necesita abrir negocios **todavía no publicados**, y `GET /negocios/:id` solo devuelve los
activos (por eso un negocio sin publicar daba 404 al entrar por URL directa).

## Alta rápida

Al crear un negocio desde el listado, ahora se cae directo en su ficha en vez de volver a la
lista — se crea con lo mínimo y se completa ahí (era la opción elegida frente al asistente de
varios pasos).

## Qué falta

- **Productos** (Fase 3): la pestaña todavía no existe. Las fotos de producto se quitaron de la
  pestaña Fotos porque su lugar natural es junto al resto de los datos de cada producto.
- **Despublicar**: no hay endpoint para volver un negocio a inactivo (`rechazar` no sirve: a un
  negocio ya verificado lo deja activo igual). Hoy solo se puede publicar.
- El **rediseño del listado** (Fase 5) sigue pendiente; por ahora las filas solo cambiaron para
  abrir la ficha en vez del panel lateral.

## Validado

Probado en el navegador contra la base de datos real, con la API corriendo en local (la de
producción bloquea `localhost` por CORS, que es justo lo que debe hacer): la ficha abre desde el
listado, las seis pestañas cargan, el mapa renderiza sobre la ubicación real del negocio, y la
pantalla del dueño sigue funcionando con el mismo editor compartido — ahora también con moneda y
mapa, que antes no tenía.
