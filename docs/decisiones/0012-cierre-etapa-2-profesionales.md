# 0012 — Cierre de Etapa 2: módulo `profesionales`

## Contexto

Los 6 módulos anteriores de `apps/api` ya tenían contrato real (mock + pantalla admin) antes de
construirse. `profesionales` era la única excepción señalada en
[0006](0006-estructura-api-nestjs.md) y [0008](0008-modulos-avisos-vecinos.md): esquema SQL listo
desde `infraestructura/migraciones/0006_contenido.sql`, pero sin mock ni pantalla que lo usara. El
usuario pidió explícitamente cerrar Etapa 2, lo que autoriza a construirlo con datos de ejemplo
nuevos — mismo criterio que ya se usó para `negocios`, `avisos` y `usuarios_app`: datos de ejemplo
realistas, claramente domésticos a este entorno de desarrollo, no información real de terceros.

## Decisiones

**Solo lectura pública** (`GET /profesionales`, `GET /profesionales/:id`), sin CRUD admin — porque
a diferencia de `cuentas`/`negocios`/`avisos`, no existe todavía una pantalla en `apps/admin` que
gestione profesionales (el doc maestro tampoco la lista explícitamente en la sección del panel de
Etapa 2). Construir un CRUD sin una pantalla real que lo consuma sería adivinar un contrato de
edición sin necesidad probada.

**Paginado por `(nombre, id)`, no por fecha de creación.** La tabla `profesionales` no tiene
columna `creado_en` (a diferencia de `negocios`/`avisos`) — y para un directorio de profesionales,
el orden alfabético es el que un vecino esperaría al buscar, no el de alta más reciente.

**Filtro opcional por `tipo`** (`medico | veterinario | legal_contable`) además del `comunidadId`
obligatorio — mismo patrón que `categoriaId` en `/negocios`.

**Se agregaron dos endpoints que faltaban para que la capa de repositorios de `apps/movil` pudiera
cerrarse por completo** (ver [0013](0013-movil-conectado-a-api.md)):
- `GET /comunidades/:id` — el contrato `RepositorioComunidades.obtenerPorId` ya existía en el
  mock pero la API nunca lo había expuesto.
- `GET /negocios/:id/productos` — la tabla `productos` existía desde `0005_negocios.sql` pero
  vacía; ahora tiene un endpoint de lectura y datos de ejemplo (la carta de "El Fogón
  Sanborjino", los mismos ítems que ya usaba `apps/movil/src/datos/mock/productos.mock.ts`).

## Estado final de Etapa 2

Los 7 módulos que definía `docs/tecnica/10-fases-pendientes.pdf` existen y están probados:
`geografia`, `categorias`, `negocios` (+ productos), `cuentas`/auth, `contenido` (avisos),
`usuarios` (vecinos), `profesionales`. Solo `pagos` queda fuera a propósito — su esquema existe
(`0009_pagos_preparado.sql`) pero activarlo requiere primero validar el modelo de ingresos
(pendiente de definición de negocio, no de código).
