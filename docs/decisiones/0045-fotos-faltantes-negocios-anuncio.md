# 0045 — Fotos faltantes de negocios y anuncio completadas

## Contexto

Tras migrar la base de datos y las fotos a Supabase (decisiones 0043 y 0044), quedaban 4
negocios y 1 anuncio sin foto — nunca la tuvieron ni siquiera en el Postgres local original
(a diferencia de los negocios agregados en la decisión 0041, que sí venían con foto desde su
creación).

## Contenido agregado

**4 negocios**, fotos buscadas y revisadas una por una (mismo criterio de siempre: sin texto,
carteles o marca que no encaje con San Borja — se descartaron 2 fotos de supermercado por
tener carteles de precios/categorías en inglés bien visibles):

| Negocio | Foto |
|---|---|
| Supermercado San Borja | Pasillo de supermercado (estantes, sin carteles de idioma visibles) |
| El Fogón Sanborjino | Parrillada de carnes servida |
| Veterinaria Aviación | Veterinario examinando un perro en consulta |
| Panadería Los Rosales | Pan artesanal recién horneado |

**1 anuncio**: "20% en parrillas — El Fogón" reutiliza la misma foto del negocio que
promociona (mismo negocio, no tenía sentido buscar una foto distinta).

Subidas directo al bucket de Supabase Storage (mismo mecanismo de la decisión 0044) y
actualizadas por `UPDATE` en `negocios.foto_principal_url` / `anuncios.imagen_url` — sin
tocar nada más.

## Qué se revisó y NO tenía imagen faltante (por diseño, no por bug)

- **Sección "Fotos del negocio" (galería) vacía** en las fichas — es un estado vacío
  intencional que invita al dueño real a subir sus propias fotos (fachada, interior), no una
  imagen rota.
- **Profesionales** (contador, veterinario, médico del directorio) — ese modelo no tiene
  campo de foto en absoluto; se basa en verificación de colegiatura, no en fotos.
- **Productos/menú** de los negocios existentes — ya todos tenían foto desde la decisión 0028.

## Validado en vivo

Confirmado en `https://app-vecinos.netlify.app`: las 4 fotos aparecen en el riel "El más
visitado", en "Negocios cerca de ti" y en la ficha completa de cada negocio; el anuncio
aparece con foto en el carrusel de Inicio.
