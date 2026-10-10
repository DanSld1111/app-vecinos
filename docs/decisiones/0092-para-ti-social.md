# 0092 — "Para ti" como red social

Fecha: 2026-10-09 · Sigue a 0091.

## Qué se decidió

Llevar "Para ti" al estilo de las redes actuales, en la app y en el panel, según los bocetos
"Ideas modernas" del lienzo de diseño.

**App (vecinos)**
- Muro a todo el ancho: fotos 4:5 deslizables, doble toque para dar corazón, íconos de corazón,
  comentar y compartir, conteos en texto, el texto en 2 líneas con «más» y "Ver los N comentarios".
- Menú «…» (ver completa, comentarios, compartir, copiar enlace) y buscador en el muro.
- Videos en vertical (`/para-ti/videos`): uno por pantalla, se pasa deslizando, arranca sin sonido
  (los navegadores no dejan otra cosa sin un toque), columna de botones a la derecha, barra de avance.
  Tocar un video en el muro abre esta vista en ese video.
- Comentarios en hoja inferior: hilos de un nivel, comentario fijado por ELISUR arriba, respuestas
  oficiales con insignia, corazón en cada comentario y reporte con motivo.
- Destacada tipo historia: título en etiquetas, pausa, "Ver publicación completa".
- Barra de pestañas flotante con una cápsula de color en la pestaña elegida.
- Cada celular avisa una vez por día que abrió Para ti con un id al azar (no identifica a nadie).

**Panel**
- Inicio de Para ti: números de 7 días contra los 7 anteriores, los 10 lugares de destacadas con su
  orden, comentarios por revisar y el muro en cuadrícula.
- Crear publicación sin elegir el tipo: se detecta por lo que se sube o pega. Así no puede volver a
  pasar que un video subido se pierda al guardar como "Solo texto". Portada elegida entre cuadros del
  video. Programar publicación. Vista previa en el muro, como destacada y a pantalla completa.
- Calendario: programadas, publicadas y vencimientos de destacadas.
- Bandeja de comentarios en tres columnas: reportados, todos, ocultos y sin responder; eliminar,
  ocultar, "Está bien", fijar, silenciar 7 días, responder como ELISUR y cerrar comentarios.

## Reglas

- Una publicación programada es `estado = 'publicada'` con `publicado_en` futuro: no hay otro estado.
  Los vecinos solo ven lo que ya cumplió su fecha. Los días de destacada cuentan desde que sale.
- Respuestas de un solo nivel: responder a una respuesta queda en el mismo hilo. Un comentario fijado
  por publicación (fijar una respuesta fija su hilo).
- Con 3 reportes un comentario se oculta solo hasta que el panel lo revise. "Está bien" o "Mantener
  oculto" lo marcan revisado y ya no se vuelve a ocultar solo. Los comentarios de ELISUR no se reportan.
- Un vecino silenciado no comenta en Para ti hasta la fecha; lo demás de la app sigue igual.

## Datos

Migración `0034_para_ti_social.sql`: `publicaciones.destacada_orden`; en `publicacion_comentarios`
`cuenta_id`, `respuesta_a`, `fijado_en`, `corazones`, `revisado` y `usuario_id` opcional;
`comentario_reportes.motivo`; tablas `comentario_corazones`, `para_ti_silenciados`,
`publicacion_compartidos` y `para_ti_visitas`.
