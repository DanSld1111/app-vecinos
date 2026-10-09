# 0091 — "Para ti", rol Editor de redes sociales y módulos que se encienden y apagan

## Contexto

El usuario pidió una pestaña nueva tipo red social (fotos, videos, noticias, corazón, compartir,
comentarios por publicación), visible en todos los distritos, y poder ocultar Comunidad y la nueva
pestaña. Bocetos aprobados el 2026-10-09 (artefacto "Para ti y módulos").

## Decisión

- **Módulos de la app** (`modulos_app`): `comunidad` y `para_ti`, con interruptor en el panel
  (solo super admin, página "Módulos de la app"). `GET /modulos` es público; la app oculta la
  pestaña apagada en `BarraPestanas` y quien llega por un enlace vuelve a Inicio. Apagar no borra
  nada. Para ti arranca **apagado**.
- **Para ti** (`publicaciones`): tipos texto, fotos (hasta 10), video subido y enlace de YouTube
  (miniatura y título por oEmbed). Sin comunidad: lo ven todos los distritos. Autor visible:
  "ELISUR". Borrador o publicada. Destacadas: 1 a 7 días, máximo 10 arriba, se quitan solas.
- **Corazones** reales (`publicacion_corazones`, uno por vecino) y **compartir** con enlace propio
  (`dawan.dev/para-ti/<id>`) y contador.
- **Comentarios** (`publicacion_comentarios`): interruptor por publicación, al instante, solo
  vecinos con cuenta. "Reportar" (`comentario_reportes`, uno por vecino); en el panel se ocultan o
  eliminan. Con los comentarios apagados, los que había no se muestran.
- **Videos sin límite de duración**: se suben directo del navegador a Supabase Storage con un
  permiso firmado de un solo uso (`firmarSubida`), sin pasar por la API. El tamaño máximo por
  archivo lo pone el plan de almacenamiento; si se excede, el panel lo dice y sugiere YouTube.
  En la app se reproducen con el reproductor del navegador (web) o una vista web (nativa), sin
  sumar una librería de video.
- **Rol `editor_redes`** ("Editor de redes sociales"): administra todo Para ti (publicar, editar,
  destacar, eliminar publicaciones, ocultar y eliminar comentarios). Solo ve ese módulo.
- **Selector de panel** para el super admin: "Administración" o "Para ti" (la vista del editor).
- Todo queda en la auditoría (`publicacion`, `comentario`, `modulo`).

Migración: `0033_para_ti.sql`.
