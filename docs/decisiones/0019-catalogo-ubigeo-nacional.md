# 0019 — Catálogo geográfico nacional completo (UBIGEO)

## Contexto

Pendiente desde el documento maestro del proyecto (sección 5) y repetido en
[10-fases-pendientes.pdf](../tecnica/10-fases-pendientes.pdf): "cargar los 1874 distritos del
Perú (UBIGEO completo), todos marcados inactivo excepto San Borja. Expandir a una zona nueva
pasa a ser activar un registro, no migrar la base de datos." Nunca se había hecho porque requería
una fuente real de datos — explícitamente se decidió no fabricar los ~1870 distritos restantes
con coordenadas o nombres inventados (ver comentario en el `generar-semilla.js` original).

## Decisiones

**Fuente: `jmcastagnetto/ubigeo-peru-aumentado`** (MIT, compilación de INEI/RENIEC/CEPLAN/MINSA/
PNUD-Perú) — ver
[fuentes-externas/ubigeo-peru-aumentado/README.md](../../infraestructura/datos-semilla/fuentes-externas/ubigeo-peru-aumentado/README.md)
para el detalle completo. Se eligió por ser la única fuente pública encontrada que trae
coordenada (lat/lng) por distrito — el esquema de este proyecto exige
`distritos.centro geography(Point) NOT NULL` (ver [decisión 0005](0005-esquema-base-de-datos.md)),
y el catálogo UBIGEO "crudo" del INEI no publica coordenadas en un formato reutilizable.

**1892 distritos, no 1874.** La fuente incluye distritos creados o reorganizados después de la
cifra que citaba el documento maestro (una versión más antigua del catálogo) — documentado en
el changelog del propio repositorio fuente. Se decidió cargar el catálogo real y actual en vez
de recortarlo a una cifra vieja.

**Se aplica como una semilla nueva (`0002_catalogo-ubigeo-nacional.sql`), no como una
migración** — no cambia el esquema, solo carga datos, y usa `ON CONFLICT (ubigeo) DO NOTHING`
en los tres niveles (departamentos, provincias, distritos) para que se pueda aplicar después de
`0001_piloto.sql` sin pisar Lima/San Borja/Miraflores/Surco/Surquillo (ya activos ahí). Orden de
aplicación documentado en el propio archivo generado y en el README de la fuente.

**Generado por script (`generar-catalogo-ubigeo.js`), no escrito a mano** — mismo patrón que
`generar-semilla.js` ya establecido en el proyecto. Corre una sola vez (o cada vez que se quiera
actualizar la fuente) y produce el `.sql` versionado que realmente se aplica.

**18 distritos sin coordenada propia en la fuente** (localidades remotas, sobre todo selva) —
se les asignó el centro de su provincia como respaldo en vez de dejarlos fuera del catálogo o
inventarles una coordenada. Documentado con el listado exacto disponible corriendo el generador.

**Limitación conocida, documentada en vez de corregida a ciegas: a varios nombres de provincia y
distrito les faltan tildes** (la fuente los trae en mayúscula y sin acentos en varios casos —
confirmado en vivo: ninguna de las 196 provincias tiene una sola vocal acentuada, mientras que
sí conservan la "ñ"). Se corrigieron a mano los 25 nombres de departamento (lista corta, bien
conocida, sin margen de error real: Áncash, Apurímac, Huánuco, Junín, San Martín). Para los
~2088 nombres de provincia/distrito, corregir cada uno sin una fuente verificada habría sido
tan poco confiable como no corregirlos — se documentó la limitación en el README de la fuente en
vez de adivinar. No afecta nada visible hoy (son registros `activo=false`); al activar una
comunidad nueva, revisar el nombre real del distrito queda como paso explícito de ese checklist.

## Validado en vivo

Aplicado contra Postgres real: **25 departamentos, 196 provincias, 1892 distritos** en total,
con exactamente los 4 distritos del piloto (San Borja, Miraflores, Surco, Surquillo) como los
únicos `activo = true` — confirmado que `ON CONFLICT DO NOTHING` preservó intactos esos
registros y sus datos (mismo nombre, misma coordenada, `activo` sin tocar). Los conteos de
`INSERT` (24/195/1888 filas nuevas) cuadran exactamente con "total menos los que ya existían del
piloto" en los tres niveles. Confirmado que la codificación UTF-8 se guardó bien (sin la
corrupción del bug de `psql -f` en Windows, documentado desde la [decisión 0009](0009-validacion-en-vivo.md)
— se usó `psql ... < archivo.sql`, nunca `-f`). El resto de la API (comunidades, negocios, etc.)
se probó después de cargar el catálogo y siguió respondiendo con normalidad.
