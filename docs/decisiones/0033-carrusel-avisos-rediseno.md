# 0033 — Rediseño del carrusel de avisos de Inicio

## Contexto

El usuario mostró el banner promocional de una app de delivery (rojo, "Descubre Supermercados
— ¡El primer envío es gratis!") y pidió adaptar ese estilo visual a Inicio, en un verde más
claro acorde a la marca. Tras un boceto inicial que asumía contenido publicitario ficticio, el
usuario aclaró que el banner en cuestión es el que ya muestra sus 4 avisos reales de la
comunidad — `CarruselAvisos.tsx`, no `CarruselPublicidad.tsx` (ese sigue igual, ver 0028/0031).
El boceto final se corrigió para usar título/cuerpo reales y el mismo ícono por categoría que ya
usa `TarjetaAviso` en Comunidad, y se ajustó una vez más para usar la tipografía real de la app
(Fraunces para el título, Plus Jakarta Sans para el resto) en vez de una fuente genérica de
sistema.

## Decisión

`CarruselAvisos.tsx` reemplaza el fondo sólido por un degradado (`expo-linear-gradient`) en tonos
de verde más claros que el rojo de referencia, alternado por índice de tarjeta (no por
categoría — todas comparten la misma familia de color; lo que distingue la categoría es el
ícono). Se agregó una insignia circular translúcida en la esquina inferior derecha con el mismo
ícono que ya usa `TarjetaAviso.estiloCategoria()` (reexportada desde ahí, no duplicada) para que
"Municipal", "Junta vecinal" y "Seguridad" se sigan viendo consistentes en toda la app. Se quitó
la ola decorativa en SVG que tenía antes — la insignia con ícono cumple ese rol visual.

## Validado en vivo

Carrusel probado con los 4 avisos reales de San Borja: Sedapal/Municipal (ícono de edificio),
Junta vecinal (ícono de personas), Serenazgo/Seguridad (ícono de escudo) — cada uno con su
degradado y su ícono correctos, título en Fraunces bold, cuerpo en Plus Jakarta Sans.
