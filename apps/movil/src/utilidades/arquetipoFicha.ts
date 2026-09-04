import { ArquetipoFicha, Categoria, Negocio } from "@app-vecinos/tipos";

/**
 * Recorre las categorías del negocio en orden y usa la primera que tenga un arquetipo de ficha
 * definido. Categorías ambiguas (como "Emprendimientos") no definen arquetipo a propósito,
 * así que se saltan hasta encontrar una que sí lo tenga.
 */
export function resolverArquetipoFicha(
  negocio: Negocio,
  categorias: Categoria[] | undefined
): ArquetipoFicha | null {
  if (!categorias) return null;
  for (const categoriaId of negocio.categoriaIds) {
    const categoria = categorias.find((c) => c.id === categoriaId);
    if (categoria?.arquetipoFicha) return categoria.arquetipoFicha;
  }
  return null;
}
