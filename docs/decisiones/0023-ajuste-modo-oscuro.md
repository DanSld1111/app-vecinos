# 0023 — Ajuste del modo oscuro: neutros limpios en vez de grises tinturados

## Contexto

Feedback directo del usuario tras ver la primera versión del modo oscuro (decisión 0022): "se
ve muy feo, muy oscuro, los colores no combinan bien".

## Diagnóstico

La primera versión de `paletaOscura` (`apps/movil/src/disenio/colores.ts`) tomó cada gris de la
paleta clara y le agregó un tinte verde oliva (fondo `#12160f`, superficie `#1a201a`, texto
suave `#aab8a6`, etc.) — la idea era mantener "la identidad verde" hasta en los neutros. En la
práctica, tinturar TODOS los grises con el mismo verde apagado hace que fondo, tarjetas y bordes
se vean casi del mismo color entre sí (poca separación visual) y que todo el conjunto luzca
turbio/sucio en vez de sobrio. Además, saturaba el verde de marca en dos roles a la vez (identidad
Y neutro de fondo), compitiendo consigo mismo.

## Decisión

Los neutros (`fondo`, `superficie`, `superficieHundida`, `superficieHundida2`, `texto`,
`textoSuave`, `textoTenue`, `borde`, `bordeFuerte`) pasan a un gris carbón **neutro** (sin
tinte de color), con una jerarquía de profundidad explícita: `fondo` es lo más oscuro, y cada
superficie por encima se aclara un paso (`superficieHundida` casi igual al fondo, `superficie`
claramente más clara — así una tarjeta se distingue del fondo sin depender solo de la sombra).

El verde y el coral de marca (`primario`, `primarioFuerte`, `acento`, `acentoFuerte`) quedan
como lo único que aporta color de verdad — se aclararon y aumentaron de saturación un poco
respecto al primer intento, para que se vean vívidos (no lavados) contra un fondo neutro oscuro.
`error` se separó más claramente del tono coral de `acento` (antes quedaban parecidos).

Mismo criterio que ya establecía la decisión 0022: esto no es "invertir" la paleta clara, es
elegir tonos que se vean bien y mantengan contraste — pero ahora aplicado también a los propios
neutros, no solo a los acentos.

## Validado en vivo

Activado el modo oscuro y recorridas Inicio, Comunidad, la ficha de un negocio y el buscador:
tarjetas ahora se distinguen claramente del fondo, los avisos/banners en verde y las etiquetas
en coral se ven vívidos y legibles, y las tarjetas de "más visitados" (avatares de iniciales)
mantienen buen contraste contra el nuevo fondo carbón.
