import { AtributoProductoDef, Categoria, Negocio, TipoFicha, tituloSeccionFicha } from "@app-vecinos/tipos";

/** Para datos que todavía no traen `fichaEfectiva` (los de ejemplo del modo sin conexión). */
const DESDE_ARQUETIPO: Record<NonNullable<Categoria["arquetipoFicha"]>, TipoFicha> = {
  menu: "menu",
  catalogo: "catalogo",
  servicios: "servicios",
  categorias: "rubros",
  ofertas: "ofertas",
};

function fichaDe(categoria: Categoria): TipoFicha {
  if (categoria.fichaEfectiva) return categoria.fichaEfectiva;
  return categoria.arquetipoFicha ? DESDE_ARQUETIPO[categoria.arquetipoFicha] : "galeria";
}

export interface FichaResuelta {
  ficha: TipoFicha;
  /** Título de la sección: el propio de la categoría o el de la ficha. */
  titulo: string;
  /** Campos extra de los productos (también los ocultos: quien los muestra filtra por `oculto`). */
  campos: AtributoProductoDef[];
}

/**
 * Qué ficha muestra un negocio (ver docs/decisiones/0080-fichas.md). La API ya resuelve la
 * herencia servicio → categoría; aquí solo se elige entre las categorías del negocio: la primera
 * que tenga una ficha con contenido propio, y la galería si todas usan galería.
 */
export function resolverFicha(negocio: Negocio, categorias: Categoria[] | undefined): FichaResuelta | null {
  if (!categorias) return null;
  const propias = negocio.categoriaIds
    .map((id) => categorias.find((c) => c.id === id))
    .filter((c): c is Categoria => Boolean(c));
  const elegida = propias.find((c) => fichaDe(c) !== "galeria") ?? propias[0];
  if (!elegida) return { ficha: "galeria", titulo: tituloSeccionFicha("galeria"), campos: [] };
  const ficha = fichaDe(elegida);
  return {
    ficha,
    titulo: tituloSeccionFicha(ficha, elegida.tituloSeccion),
    campos: elegida.atributosProducto ?? [],
  };
}

/**
 * Los campos extra de un producto que se muestran, en el orden de la categoría y con su etiqueta
 * ("Talla: M"). Si la categoría no define campos, se muestran los valores tal cual vienen (datos
 * cargados antes de que existieran los campos configurables).
 */
export function atributosVisibles(
  atributos: Record<string, string> | undefined,
  campos: AtributoProductoDef[]
): { clave: string; texto: string }[] {
  const valores = atributos ?? {};
  if (campos.length === 0) {
    return Object.entries(valores)
      .filter(([, valor]) => valor)
      .map(([clave, valor]) => ({ clave, texto: valor }));
  }
  return campos
    .filter((c) => !c.oculto && valores[c.clave])
    .map((c) => ({ clave: c.clave, texto: `${c.etiqueta}: ${valores[c.clave]}` }));
}
