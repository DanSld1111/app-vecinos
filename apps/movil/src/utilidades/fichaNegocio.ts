import { AtributoProductoDef, AvisoFicha, Categoria, Negocio, TipoFicha, tituloSeccionFicha } from "@app-vecinos/tipos";

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
  /** Aviso fijo de la categoría (ej. "+18" en Licorerías), o null. */
  aviso: AvisoFicha | null;
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
  if (!elegida) return { ficha: "galeria", titulo: tituloSeccionFicha("galeria"), campos: [], aviso: null };
  const ficha = fichaDe(elegida);
  return {
    ficha,
    titulo: tituloSeccionFicha(ficha, elegida.tituloSeccion),
    campos: elegida.atributosProducto ?? [],
    // El aviso puede venir de cualquiera de sus categorías (una licorería que también es bodega).
    aviso: propias.find((c) => c.avisoFicha?.texto)?.avisoFicha ?? null,
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
    .filter((c) => !c.oculto && !c.insignia && valores[c.clave])
    .map((c) => ({ clave: c.clave, texto: `${c.etiqueta}: ${valores[c.clave]}` }));
}

const normalizar = (texto: string) => texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Las insignias de un producto: la etiqueta de cada campo marcado como insignia cuyo valor es "Sí" (ej. "Receta"). */
export function insigniasDe(atributos: Record<string, string> | undefined, campos: AtributoProductoDef[]): string[] {
  const valores = atributos ?? {};
  return campos.filter((c) => c.insignia && !c.oculto && normalizar(valores[c.clave] ?? "") === "si").map((c) => c.etiqueta);
}

/**
 * El campo por el que la ficha deja filtrar (ej. Especie) y sus botones. Una opción que contiene a
 * otra ("Perro y gato") no es un botón propio: aparece al elegir "Perro" y al elegir "Gato".
 */
export function filtroDeCampos(campos: AtributoProductoDef[]): { campo: AtributoProductoDef; opciones: string[] } | null {
  const campo = campos.find((c) => c.filtro && !c.oculto && c.tipo === "opciones" && (c.opciones?.length ?? 0) > 1);
  if (!campo) return null;
  const todas = campo.opciones ?? [];
  const opciones = todas.filter((o) => !todas.some((otra) => otra !== o && normalizar(o).includes(normalizar(otra))));
  return { campo, opciones };
}

/** Si el valor de un producto entra en la opción elegida del filtro ("Perro y gato" entra en "Perro"). */
export function coincideFiltro(valor: string | undefined, opcion: string): boolean {
  return Boolean(valor) && normalizar(valor!).includes(normalizar(opcion));
}

/** Texto detrás del precio según un campo del producto (ej. Operación = Alquiler → " /mes"), o "". */
export function sufijoPrecio(atributos: Record<string, string> | undefined, campos: AtributoProductoDef[]): string {
  const valores = atributos ?? {};
  const campo = campos.find((c) => c.sufijoPrecio && !c.oculto && valores[c.clave] === c.sufijoPrecio.opcion);
  return campo ? ` ${campo.sufijoPrecio!.sufijo}` : "";
}
