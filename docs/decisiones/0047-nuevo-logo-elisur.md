# 0047 — Nuevo logo e identidad visual de ELISUR

## Contexto

El usuario diseñó un logo nuevo con una IA generadora de imágenes: un isotipo "E + hoja" en
blanco sobre un cuadrado verde redondeado, más el lockup horizontal (ícono + "ELISUR" en
tipografía serif). Pidió usarlo en la app.

## Problema con los archivos originales

Los dos PNG que compartió (`icono.png`, `logo.png`) eran **renders de presentación** — el
logo "grabado en relieve" sobre una lámina de papel con textura, sombras realistas y fondo
gris claro no uniforme. Usarlos tal cual como ícono de app se habría visto mal: ruido de
textura visible a tamaño chico, sombras que no funcionan sobre fondos oscuros, y sin
transparencia real (necesaria para el ícono adaptativo de Android).

## Solución: limpieza y aplanado de los assets

Con Python (PIL + scipy, ya disponibles en el entorno) se separó el símbolo del fondo por
color (verde real vs. blanco del glyph, distinguiendo el blanco *interior* del glyph del
blanco *exterior* de la lámina con flood-fill/`ndimage.label`), se aplanó a un verde sólido
(`#1a531a`) y un blanco puro, y se suavizaron los bordes (cierre morfológico + blur + umbral)
para quitar el grano de la textura de papel. De ahí se generaron todas las variantes que el
proyecto necesita:

- `assets/icon.png` (1024×1024, full-bleed, sin transparencia — lo usa Expo/iOS)
- `assets/favicon.png`
- `assets/icono-app.png` (con esquinas redondeadas y fondo transparente, para uso dentro de
  la UI si se necesita como imagen)
- `assets/android-icon-background.png` (verde sólido) + `-foreground.png` y `-monochrome.png`
  (solo el glyph blanco sobre transparente, con zona seguro ~46% del lienzo para la máscara
  adaptativa de Android)
- `assets/splash.png` / `splash-icon.png`
- `assets/logo-principal.png` (el lockup horizontal, misma limpieza)

## Cambios de código

- `apps/movil/src/config/marca.ts`: `colores.primario` → `#1a531a`, `secundario` → `#123d13`
  (10% más oscuro, no lo definió el usuario explícitamente).
- `apps/movil/app.json`: `android.adaptiveIcon.backgroundColor` → `#1a531a` (antes `#E6F4FE`,
  un celeste que no correspondía a la marca — quedaba como color de repuesto de Expo).
- `apps/movil/src/componentes/IlustracionSaludo.tsx`: el ícono de marca que se muestra en el
  login y en la barra superior de Inicio (antes una ilustración genérica de "montaña + sol")
  ahora dibuja el isotipo real ("E" + hoja) **en SVG vectorial**, no como imagen — se mantiene
  nítido a cualquier tamaño y respeta los colores del tema (`useColores()`), a diferencia de
  un PNG fijo. Es una versión simplificada a trazos, no una réplica pixel-perfecta del glyph
  original (suficiente para un ícono de 30px).

## Pendiente / a validar

- El usuario debe confirmar si el verde `#1a531a` es exactamente el que quería (su propio
  tablero de marca tenía un error de tipeo: la muestra de "Blanco de fondo" mostraba el mismo
  código hex que el verde).
- `logo-principal.png` no se usa todavía en ningún componente (se generó por consistencia con
  `marca.rutasDeRecursos`, que ya lo referenciaba desde antes de este cambio).
