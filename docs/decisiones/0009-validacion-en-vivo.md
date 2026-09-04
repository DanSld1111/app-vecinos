# 0009 — Primera validación en vivo contra una base real

## Contexto

Hasta ahora todo (esquema, semillas, los 6 módulos de `apps/api`) se había verificado solo por
compilación y por guards respondiendo sin base de datos. El usuario tenía Postgres 18 corriendo
localmente; con su autorización se instaló la extensión PostGIS (vía Stack Builder) y se creó la
base `app_vecinos` para probar el sistema completo de punta a punta por primera vez.

## Qué se probó y confirmó

- Las 9 migraciones y la semilla `0001_piloto.sql` aplican limpio en una base nueva.
- Lectura pública: `/categorias`, `/comunidades`, `/comunidades/detectar` (detectó correctamente
  San Borja dado un punto GPS dentro del radio) y `/negocios` con filtro por comunidad.
- Login real: contraseña incorrecta → 401; contraseña correcta → token + cuenta sin
  `password_hash`; `ultimoAccesoEn` se actualiza de verdad.
- Guards de rol: una cuenta `validador_contenido` recibe 403 en `/cuentas` (reservado a
  `super_admin`).
- Alcance por distrito en avisos: el validador de Surco solo ve el pendiente de Surco en
  `/avisos/pendientes`, recibe 403 al intentar aprobar un aviso de San Borja, y aprobar el suyo lo
  publica de verdad — verificado que después aparece en la lectura pública `/avisos?comunidadId=...`.
- CRUD de cuentas: crear (con hash real, verificado haciendo login con esa cuenta), correo
  duplicado → 409, eliminar → 204.
- Vecinos (`usuarios_app`): listar y alternar bloqueo.

## Bug encontrado y corregido

`UsuariosService.alternarBloqueo` fallaba con `la columna «estado» es de tipo estado_usuario_app
pero la expresión es de tipo text` — Postgres no infiere el cast de un `CASE WHEN ... THEN 'x' ELSE
'y' END` de vuelta al tipo enum de la columna en un `UPDATE`. Se corrigió agregando el cast
explícito `::estado_usuario_app` en `apps/api/src/modulos/usuarios/usuarios.service.ts`. Ningún
otro `UPDATE` del código usa este patrón (los demás asignan un valor ya tipado desde un parámetro
o una constante SQL), así que no hay otras instancias del mismo bug.

## Bug de codificación encontrado (Windows + `psql -f`)

Al recargar la base tras el cambio de [0010](0010-registro-vecinos-correo-clave.md), los nombres
con tildes (`Méndez`, `Huamán`, `Ríos`...) y textos con "ñ"/"—" quedaron guardados corruptos
(`MÃ©ndez`) — verificado que no era un problema de visualización de terminal, sino corrupción real
en la base (confirmado leyendo directo por la API con el driver `pg`, no por la salida de `psql`).

**Causa:** en esta instalación de PostgreSQL 18 para Windows, `psql -f archivo.sql` lee el archivo
con la codepage de la consola en vez de como UTF-8 crudo, sin importar que `client_encoding` ya
esté en `UTF8` — cada carácter multibyte se reinterpreta como bytes sueltos de otra codificación y
se vuelve a codificar en UTF-8 (doble codificación clásica). El archivo `.sql` en disco siempre
estuvo correcto (verificado byte a byte); el daño ocurre solo al leerlo con `-f`.

**Fix:** redirigir el archivo por stdin en vez de `-f`: `psql "$DATABASE_URL" < archivo.sql`. Esto
no pasa por la misma ruta de lectura y preserva los bytes UTF-8 tal cual. Actualizado en ambos
README (`infraestructura/migraciones/` y `infraestructura/datos-semilla/`).

## Estado de la base local

Después de las pruebas, la base `app_vecinos` se recreó desde cero (drop + migraciones + semilla)
para dejarla en el mismo estado que describe `infraestructura/datos-semilla/README.md` — las
pruebas habían aprobado un aviso y alternado un bloqueo, y no correspondía dejar esa base "sucia"
como si fuera el estado de partida real.

## Cómo levantarlo de nuevo

```bash
cp apps/api/.env.example apps/api/.env   # ya existe uno local apuntando a postgres://postgres:root@127.0.0.1:5432/app_vecinos
npm run api
```
