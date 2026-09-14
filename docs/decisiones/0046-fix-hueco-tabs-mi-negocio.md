# 0046 — Corregido espacio en blanco en las pestañas de "Mi negocio"

## Contexto

Al hacer un test guiado del modo gestión (dueño de negocio y junta vecinal, con las cuentas
`dueno@elisur.com` / `junta@elisur.com`) se encontró un espacio en blanco grande arriba del
contenido en las 5 pestañas de "Mi negocio" (Información, Horario, Fotos, Ofertas, Estado) —
visible en la versión web (Netlify), no confirmado en nativo.

## Causa raíz

`PantallaMiNegocio.tsx` arma las pestañas con un `<ScrollView horizontal>` sin `style` propio
(solo `contentContainerStyle`). En React Native Web, un `ScrollView` sin `style` explícito se
comporta como `flex: 1` dentro de su contenedor — compite por el espacio vertical disponible
contra el `ScrollView` del contenido de la pestaña activa (que sí tiene `flex: 1` a propósito).

Medido en el DOM real: la fila de pestañas, que solo necesita ~40px para su texto, terminaba
midiendo **314px de alto**, empujando el contenido real (formulario, horario, etc.) muy abajo
y dejando ese hueco vacío arriba.

## Solución

Se agregó `style={styles.tabsScroll}` al `ScrollView` de pestañas, con
`{ flexGrow: 0, flexShrink: 0 }` — evita que se estire, deja que solo ocupe la altura de su
contenido real.

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
```

Se revisó si el mismo patrón (`ScrollView horizontal` sin `style`) aparecía en otro lado de la
app — solo hay un caso más (`OfertasPasillosNegocio.tsx`), pero ese sí pasa un `style` propio
(`filaOfertas`), así que no está expuesto al mismo bug. No se tocó.

## Validado en vivo

Probado en local (`npm run web`) con la cuenta `dueno@elisur.com`: las pestañas "Información"
y "Horario" ahora muestran todo su contenido sin espacio vacío — el formulario completo y los
7 días de horario caben en pantalla sin necesidad de scroll extra.
