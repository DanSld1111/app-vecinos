/**
 * Qué bloque de contenido muestra la ficha de un negocio de esta categoría:
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
  /** @deprecated Se mantiene solo para que la app móvil siga renderizando las 5 fichas fijas. El panel admin ya gestiona esto vía `arquetipoId`. */
  arquetipoFicha?: ArquetipoFicha;
  /** Referencia a un `Arquetipo` real (paquetes/tipos/src/arquetipo.ts), gestionado desde el módulo Arquetipos del admin. */
  arquetipoId?: string;
  /** Vacío o ausente = los productos de esta categoría no tienen atributos especiales. */
  atributosProducto?: AtributoProductoDef[];
}
