# 0088 — Licorerías y Veterinarias: aviso en la ficha, filtro por un campo e insignias

## Contexto

No había categoría para licorerías ni para farmacias veterinarias. "Mascotas" está en "Otros
servicios" (próximamente) y su ficha es de servicios con tarifa, no de productos. El boceto aprobado
(2026-10-09) pedía además un aviso "+18", un aviso de receta, filtrar el catálogo por mascota y
marcar los productos que se venden con receta.

## Decisión

- **Dos categorías nuevas** (datos, no código):
  - *Licorerías* en Supermarket, ficha heredada "Ofertas y pasillos". Campos: Tipo, Presentación,
    Volumen. Aviso +18.
  - *Veterinarias* en Market Space, ficha "Catálogo". Campos: Especie (filtro), Peso o tamaño,
    Presentación, Receta (insignia). Aviso de receta.
- **Aviso en la ficha** (`categorias.aviso_ficha`, migración 0031): `{ tipo: "mayores18" | "receta" |
  "info", texto }`. La app lo muestra bajo la descripción de todos los negocios de la categoría, con
  la primera oración en negrita. Se edita en Categorías.
- **Campos de producto con uso** (dentro de `atributos_producto`, sin columna nueva), solo para
  campos de tipo "opciones":
  - `filtro`: el catálogo ofrece "Todos" + cada opción. Una opción que contiene a otra ("Perro y
    gato") no es botón propio: entra al elegir "Perro" y al elegir "Gato".
  - `insignia`: si el producto tiene "Sí", la etiqueta del campo va como insignia sobre la foto
    (y en el menú, junto a "Más pedido") en vez de como un dato más.
- **Ofertas y pasillos con productos**: si un negocio con esa ficha también carga productos, se
  listan debajo ("Todo lo que vende") con los campos de la categoría. `FICHAS.ofertas.usaProductos`
  pasa a `true` para poder definir esos campos.
- El celular de vista previa del panel muestra el aviso, el filtro y las insignias igual que la app.

## Pendiente

- Foto de la tarjeta de cada categoría en Inicio (hoy usan el ícono).
- Que un vecino confirme su edad antes de ver una licorería no se pidió: el aviso es informativo.
