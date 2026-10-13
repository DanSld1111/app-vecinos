# 0094 — Visualizaciones de las publicaciones de Para ti

Fecha: 2026-10-13 · Sigue a 0092.

## Qué se decidió

Cada publicación muestra en el panel cuántas veces la vieron (ojo · corazones · comentarios en la
tarjeta del muro), y el inicio de Para ti suma la métrica «Visualizaciones» de los últimos 7 días.

## Qué cuenta como visualización

Un celular que vio la publicación ese día, en cualquiera de estos lugares:

- en el muro, con al menos la mitad en pantalla durante 1 segundo;
- abierta (publicación completa);
- en los videos en vertical, cuando es la que está en pantalla;
- como destacada (historia).

Se cuenta **una vez por celular, publicación y día** (tabla `publicacion_vistas`, el mismo id al
azar que usan las visitas de 0092): volver al muro o abrirla otra vez no la infla. No pide cuenta.
La app manda las vistas en tandas cada 3 segundos (`POST /para-ti/vistas`, hasta 30 ids) y solo
suman las publicaciones visibles (publicadas y con su fecha cumplida).

## Datos

Migración `0035_para_ti_vistas.sql`: `publicaciones.vistas` (total, para leerlo rápido) y
`publicacion_vistas (publicacion_id, visitante, dia)`.
