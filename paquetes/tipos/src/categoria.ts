import type { TipoFicha } from "./ficha";

/**
 * @deprecated Reemplazado por TipoFicha (ficha.ts). La API lo sigue enviando, calculado a partir
 * de la ficha efectiva, solo para versiones viejas de la app. Qué bloque de contenido muestra la ficha de un negocio de esta categoría:
 * menu = platos con precio (restaurantes, comida)
 * catalogo = grilla de productos con foto y precio (moda, artesanía)
 * servicios = lista de servicios con tarifa (salud, mascotas, servicios)
 * categorias = rubros que maneja, sin precio (ferreterías, bazares)
 * ofertas = ofertas de la semana + pasillos (supermercados)
 * Si no se define, la ficha usa la galería genérica de fotos.
 */
export type ArquetipoFicha = "menu" | "catalogo" | "servicios" | "categorias" | "ofertas";

/**
 * Un campo propio de los productos de negocios de esta categoría — ej. "Talla" en Moda,
 * "Nivel de picante" en Comida. Ver docs/decisiones/0071-plan-v2-modulo-negocios.md.
 * Borrador inicial, pensado para que se ajuste con el tiempo — no es un esquema cerrado.
 */
export interface AtributoProductoDef {
  /** Clave estable para guardar en Producto.atributos — no cambiar una vez usada en datos reales. */
  clave: string;
  etiqueta: string;
  /** "color" = combo con muestra de color (paleta fija, ver SelectorColorAtributo en el admin). */
  tipo: "opciones" | "texto" | "color";
  /** Solo si tipo = "opciones". */
  opciones?: string[];
  /** Oculto = no se pide al cargar productos ni se muestra en la app, pero los valores ya
   * guardados se conservan (se puede volver a mostrar). */
  oculto?: boolean;
  /** Solo "opciones": la ficha ofrece filtrar los productos por este campo ("Todos" + cada
   * opción), ej. Especie en Veterinarias. Ver docs/decisiones/0088. */
  filtro?: boolean;
  /** Solo "opciones": un producto con valor "Sí" muestra la etiqueta del campo como insignia sobre
   * su foto en vez de un dato más, ej. "Receta". */
  insignia?: boolean;
  /** Solo "opciones": cuando el producto tiene `opcion`, el precio lleva `sufijo` detrás (ej.
   * Operación = Alquiler → "$ 950 /mes"). Ver docs/decisiones/0089. */
  sufijoPrecio?: { opcion: string; sufijo: string };
}

/** Aviso fijo en la ficha de todos los negocios de una categoría, bajo la descripción. */
export interface AvisoFicha {
  /** mayores18 = venta solo a mayores de edad; receta = medicamentos con receta; info = otro. */
  tipo: "mayores18" | "receta" | "info";
  texto: string;
}

export interface Categoria {
  id: string;
  padreId: string | null;
  nombre: string;
  slug: string;
  icono: string;
  /** Foto que representa la categoría en la tarjeta de Inicio (reemplaza al ícono ahí). Ver docs/decisiones/0029-categorias-con-foto.md. */
  fotoUrl: string | null;
  orden: number;
  /** @deprecated Usar `fichaEfectiva`. Se mantiene para versiones viejas de la app. */
  arquetipoFicha?: ArquetipoFicha;
  /** Ficha elegida para esta categoría. null = hereda la de su servicio. Ver ficha.ts. */
  ficha?: TipoFicha | null;
  /** La ficha que se muestra de verdad: la propia, o la del servicio, o la galería si ninguno
   * define una. La calcula la API. */
  fichaEfectiva?: TipoFicha;
  /** Título propio de la sección de la ficha (ej. "Nuestras prendas"). null = el de la ficha. */
  tituloSeccion?: string | null;
  /** Campos extra de los productos. Vacío o ausente = los productos no tienen campos especiales. */
  atributosProducto?: AtributoProductoDef[];
  /** A qué servicio pertenece (ServicioApp.slug) — filtra qué categorías se ofrecen al elegir
   * el servicio en el alta de negocio, y qué negocios entran en la pantalla de ese servicio en
   * la app. null = todavía sin asignar. Ver docs/decisiones/0072-servicio-dueno-de-categoria.md. */
  servicioSlug: string | null;
  /** Aviso en la ficha de sus negocios (ej. "+18" en Licorerías). null o ausente = ninguno. */
  avisoFicha?: AvisoFicha | null;
}
