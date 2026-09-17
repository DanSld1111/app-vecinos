# Datos semilla

`0001_piloto.sql` no se edita a mano — lo genera `generar-semilla.js` a partir de los mismos
datos de ejemplo que ya usa `apps/admin/src/datos/mock/*.ts`. Si el mock cambia (nuevo negocio,
nueva cuenta, etc.), se vuelve a correr el generador y se reemplaza el `.sql`.

```bash
node infraestructura/datos-semilla/generar-semilla.js
```

Requiere `bcryptjs` (ya es dependencia de `apps/api`, se resuelve por el hoisting de npm
workspaces — correr `npm install` en la raíz del monorepo al menos una vez).

## Qué carga

- Lima (departamento + provincia) y los 4 distritos piloto (San Borja, Miraflores, Surco, Surquillo)
- Las 4 comunidades, 10 cuentas del panel (con sus contraseñas de prueba **hasheadas** con bcrypt, no en texto plano) y sus distritos asignados
- 7 plantillas visuales, 6 arquetipos, 14 categorías
- 9 negocios de ejemplo con sus categorías, 3 anuncios, 7 avisos, 8 vecinos de ejemplo, 2 novedades

## Qué NO carga (a propósito)

- `productos` y `profesionales`: no existe mock de ejemplo para ninguna de las dos todavía.

## Catálogo UBIGEO completo (`0002_catalogo-ubigeo-nacional.sql`)

25 departamentos, 196 provincias y 1892 distritos del Perú — fuente real, no inventada, ver
[`fuentes-externas/ubigeo-peru-aumentado/README.md`](fuentes-externas/ubigeo-peru-aumentado/README.md).
Generado por `generar-catalogo-ubigeo.js` (no editar el `.sql` a mano). Se aplica DESPUÉS de
`0001_piloto.sql` — usa `ON CONFLICT DO NOTHING`, así que el piloto (San Borja/Miraflores/
Surco/Surquillo) queda intacto; todo lo demás entra `activo=false`, listo para activarse el
día que se expanda a una comunidad nueva. **Ya aplicado a la base de producción en Supabase**
(2026-09-17).

## Orden de aplicación

```bash
for f in infraestructura/migraciones/0*.sql \
         infraestructura/datos-semilla/0001_piloto.sql \
         infraestructura/datos-semilla/0002_catalogo-ubigeo-nacional.sql; do
  psql "$DATABASE_URL" < "$f"
done
```

**En Windows usar `< "$f"`, nunca `-f "$f"`** — ver la nota de codificación en [`infraestructura/migraciones/README.md`](../migraciones/README.md).
