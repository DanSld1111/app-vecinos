# 0042 — Repositorio en GitHub para trabajar desde varias PCs

## Contexto

El proyecto vivía solo en una carpeta local (`D:\Proyectos locales\app vecinos`), sin control
de versiones. El usuario pidió poder seguir programando desde otras PCs y desde el celular, lo
que requiere primero tener el código en un repositorio remoto.

## Qué se hizo

- Se inicializó git en la raíz del monorepo y se creó el repositorio
  **`https://github.com/DanSld1111/app-vecinos`** (privado), autenticado vía `gh` con la cuenta
  `DanSld1111`.
- Commit inicial con 478 archivos (todo el monorepo salvo lo excluido en `.gitignore`).

## Problema de seguridad encontrado y corregido antes del primer push

El script `"meilisearch"` de `package.json` tenía el **master key de Meilisearch hardcodeado en
texto plano** (`--master-key <clave>`). Ese archivo sí se commitea, así que la clave hubiera
quedado expuesta en el historial de git aunque el repo sea privado. Se sacó el flag del script —
Meilisearch toma la clave del `.env` de `herramientas/meilisearch/` (que sí está ignorado),
porque el comando ya hace `cd` a esa carpeta antes de arrancar el binario.

## Ajustes a `.gitignore`

Se agregaron dos patrones que faltaban, además de los ya existentes (`node_modules/`, `dist/`,
`.env`, etc.):
- `uploads/` — archivos subidos por usuarios (ej. `apps/api/uploads/`), no son código.
- `bugreport-*.zip` — un bug report de Android (5.4MB) que había quedado suelto en la raíz, sin
  relación con el código.

El binario `herramientas/meilisearch/meilisearch.exe` (128MB) y su carpeta `data/` ya estaban
cubiertos por el `.gitignore` propio de esa carpeta (decisión previa, ver
`herramientas/meilisearch/README.md`).

## Documentación agregada

[`docs/tecnica/06-guia-de-desarrollo.md`](../tecnica/06-guia-de-desarrollo.md) ganó una sección
**"Preparar una PC nueva (clon del repo)"** con los pasos completos: clonar, `npm install`, qué
`.env` crear en cada app (`apps/api`, `apps/admin`, `apps/movil`) y a partir de qué
`.env.example`, cómo levantar Postgres, y cómo levantar Meilisearch de forma opcional con su
propia master key generada por PC.

## Flujo de trabajo multi-PC

Sin reglas nuevas de proceso más allá del uso normal de git: `git pull` antes de empezar a
trabajar en una PC, `git push` antes de cambiar de PC. Los archivos que varían por entorno
(`.env`, `node_modules`, builds) no viven en git — cada PC los genera o configura por su cuenta
siguiendo la guía de desarrollo.
