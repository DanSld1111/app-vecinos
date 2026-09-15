# 0049 — Fix: "Negocios más visitados" no mostraba fotos reales

## Contexto

En el buscador (`app/buscar.tsx`), la sección "Negocios más visitados" mostraba siempre el
avatar de iniciales (`AvatarNegocio`) sin importar si el negocio tenía una foto real
(`fotoPrincipalUrl`) o no — a diferencia de otras listas de la app (`RielMiniNegocios`,
`TarjetaNegocio`) que sí revisan primero si hay foto y solo caen al avatar de iniciales
cuando de verdad no existe (ver decisión 0022, el patrón "iniciales por defecto").

## Causa

Línea con `<AvatarNegocio nombre={negocio.nombre} size={56} />` sin condicional — un olvido al
construir esa sección, no relacionado con el resto del sistema de avatares/fotos (que sí
funciona bien en todos los demás lugares).

## Solución

Mismo patrón que `RielMiniNegocios.tsx`: si `negocio.fotoPrincipalUrl` existe, mostrar
`<Image>` con esa URL; si no, `AvatarNegocio` como respaldo.

## Validado en vivo

Con la comunidad San Borja activa, "Negocios más visitados" ahora muestra las fotos reales
(cerrajería, inmobiliaria, veterinaria, El Fogón, etc.) — los negocios sin foto siguen
cayendo correctamente al avatar de iniciales.
