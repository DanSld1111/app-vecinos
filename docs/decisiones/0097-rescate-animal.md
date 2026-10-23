# 0097 — Rescate animal: adopción, padrinazgo y perdidos y encontrados

## Contexto

Rescate animal usaba la ficha «Servicios»: un albergue era un negocio con una lista de precios, sin
lugar para cada mascota, ni para avisos de mascotas perdidas, ni para donar o apadrinar. Los bocetos
(canvas «Rescate animal») tomaron ideas de Petfinder, Club WUF y apps de mascotas perdidas.

## Decisión

**Datos (migración 0037).**
- `mascotas`: las que publica un albergue (especie, sexo, edad, tamaño, peso, fotos, personalidad,
  salud, convivencia, historia, estado `disponible | en_proceso | adoptada`, urgente, apadrinable).
- `solicitudes_adopcion` y `padrinazgos`: lo que el vecino envía desde la app, con número visible
  (N.º 1001…, N.º 301…) y el estado que el albergue va cambiando.
- `avisos_mascotas`, `avisos_pistas`, `avisos_reportes`: perdidos y encontrados de los vecinos.
- `negocios.datos_albergue`: Yape o Plin, aportes sugeridos, requisitos, necesidades y turnos.
- Ficha nueva `mascotas` en los CHECK de `servicios_app` y `categorias`.

**Adónde va cada dato.** La solicitud, el padrinazgo, el aviso y cada pista se guardan en la base.
WhatsApp solo se usa para conversar: la app deja el mensaje escrito (respuestas de la solicitud,
monto del padrinazgo, dónde se vio la mascota). El dinero nunca pasa por la app: va directo al Yape o
Plin del albergue; «Ya pagué» deja el padrinazgo «por confirmar» hasta que el albergue lo confirma.

**Reglas.**
- Adoptar, apadrinar, publicar avisos y dejar pistas piden la cuenta de vecino.
- Una solicitud «En entrevista» o «Aprobada» deja a la mascota «En proceso»; «Adoptada» la saca de la
  lista y cierra como no aprobadas las demás solicitudes abiertas por ella.
- Un padrino activo sin pago en 40 días figura como «Atrasado».
- Los avisos se publican al instante. Con 3 reportes de vecinos distintos se ocultan hasta que ELISUR
  los revise en el panel. Vencen a los 30 días. El WhatsApp de quien publica solo se muestra si lo
  permitió; si no, las pistas le llegan dentro de la app.
- Al publicar un aviso se envía una notificación push a la comunidad (solo llega a quien tiene la
  app con notificaciones activas). Además, el aviso sale arriba del Inicio durante 7 días.

**App.** Rescate animal abre con adoptar (filtros por especie y edad), Perdidos, Ayudar y los
albergues. Pantallas nuevas en `app/rescate/`: perfil de la mascota, solicitud, apadrinar, ayudar
(apadrinar / donar / voluntario), perdidos, reportar, detalle del aviso con «Lo vi» / «Es mío» y
Mi actividad (también desde Perfil). Un albergue con la ficha `mascotas` muestra sus mascotas.

**Panel.** Pestaña «Mascotas y adopciones» en la ficha del negocio y en «Mi negocio»: mascotas,
solicitudes, padrinos y cómo ayudar. Página «Mascotas perdidas» del super admin para moderar avisos.

**De paso.** Los enlaces `wa.me` no llevaban el código de país cuando el número se guardó con 9
dígitos (23 de 50 negocios): `enlaceWhatsapp` agrega el 51 y se usa en toda la app.

## Pendiente

- Elegir el punto en un mapa al reportar (hoy: referencia escrita y «usar mi ubicación actual»).
- Recordatorio mensual al padrino y novedades del albergue para sus padrinos.
