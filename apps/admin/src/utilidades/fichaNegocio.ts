import { Categoria, Negocio, TipoFicha, tituloSeccionFicha } from "@app-vecinos/tipos";

/**
 * La ficha que muestra un negocio en la app — mismo criterio que apps/movil/src/utilidades/
 * fichaNegocio.ts: la primera de sus categorías con una ficha distinta de la galería.
 */
export function fichaDelNegocio(negocio: Negocio, categorias: Categoria[]) {
  const suyas = negocio.categoriaIds
    .map((id) => categorias.find((c) => c.id === id))
    .filter((c): c is Categoria => Boolean(c));
  const categoria = suyas.find((c) => (c.fichaEfectiva ?? "galeria") !== "galeria") ?? suyas[0] ?? null;
  const ficha: TipoFicha = categoria?.fichaEfectiva ?? "galeria";
  return { ficha, categoria, titulo: tituloSeccionFicha(ficha, categoria?.tituloSeccion) };
}

/**
 * Qué editores de contenido de ficha corresponden a un negocio: el de su ficha, más cualquiera
 * que ya tenga datos (para no esconder algo cargado si la categoría cambió de ficha).
 */
export function pestanasDeContenido(negocio: Negocio, categorias: Categoria[]): ("servicios" | "rubros" | "pasillos")[] {
  const { ficha } = fichaDelNegocio(negocio, categorias);
  const lista: ("servicios" | "rubros" | "pasillos")[] = [];
  if (ficha === "servicios" || negocio.serviciosOfrecidos?.length) lista.push("servicios");
  if (ficha === "rubros" || negocio.rubrosDisponibles?.length) lista.push("rubros");
  if (ficha === "ofertas" || negocio.pasillos?.length) lista.push("pasillos");
  return lista;
}
