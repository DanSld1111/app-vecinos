# 0057 — Animación de carga: la hoja creciendo

## Contexto

El bundle de React (2MB+) tarda un momento en cargar y ejecutar, sobre todo en la app instalada
en el iPhone. Se le pidió al usuario elegir entre 4 ideas originales de animación para ese
tramo; eligió la 1: la "E" del isotipo se dibuja con un trazo y la hoja "brota" desde su punta —
conecta directo con el lema de marca ("hacer crecer la comunidad").

## Por qué no es un componente de React

Esta animación se muestra **antes** de que el bundle de React termine de cargar — si dependiera
de React, no cubriría justo el momento que se quiere cubrir. Por eso vive en
`inyectar-head-pwa.js` (ver [decisión 0055](0055-pwa-instalable-y-animaciones.md)): HTML/CSS/SVG
puro, inyectado directo en `dist/index.html` después del build, con un `<script>` de ~10 líneas
sin dependencias que la retira apenas `#root` tiene contenido real.

## Cómo funciona

- Mismo isotipo que `IlustracionSaludo.tsx` (la "E" + la hoja) para consistencia de marca —
  mismos paths SVG, sin duplicar el diseño, solo la técnica de dibujo es distinta.
- **La "E"**: `stroke-dasharray`/`stroke-dashoffset` con `pathLength="100"` (normaliza el largo
  del trazo a 0–100 sin tener que calcular la longitud real del path a mano) — se "escribe" de
  principio a fin.
- **La hoja**: `transform: scale()` desde 0, con origen en el punto donde se une al tallo de la
  "E" (`transform-origin: 21px 21px`, la misma coordenada donde nace la hoja en el path), más un
  rebote elástico (`cubic-bezier(.34,1.56,.64,1)`, pasa por 1.08 antes de asentarse en 1) — da la
  sensación de que brota, no que aparece.
- Loop de 2.6s con un `opacity` de entrada/salida en el contenedor para que el reinicio del loop
  no se sienta como un salto brusco.
- `prefers-reduced-motion: reduce` respetado — sin animación, el logo completo queda visible de
  una.

## Validado en vivo

Build de producción real, aislando el fragmento inyectado en un HTML de prueba (para no
competir contra lo rápido que carga en local): se midió programáticamente la secuencia completa
— la "E" traza entre ~0.2s y ~0.9s del ciclo, la hoja aparece con el rebote (`scale` pasa por
1.18 → 1.02 → 1.0) entre ~1.4s y ~1.7s. También se confirmó que el script de remoción funciona:
tras el build normal (`npm run build`), tan pronto la app real monta, `#carga-elisur` desaparece
del DOM.
