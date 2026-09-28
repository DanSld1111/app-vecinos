/**
 * Fichas: los diseños de la ficha de un negocio que la app sabe mostrar. Reemplazan a Plantillas
 * y Arquetipos (ver docs/decisiones/0080-fichas.md). Cada servicio tiene una ficha por defecto y
 * cada categoría la hereda o elige otra. Una ficha nueva es código nuevo en la app: se agrega aquí
 * y en el componente que la dibuja (apps/movil/app/negocio/[id]/index.tsx).
 */
export type TipoFicha = "menu" | "catalogo" | "servicios" | "rubros" | "ofertas" | "galeria";

export interface InfoFicha {
  nombre: string;
  /** Título de la sección en la ficha cuando la categoría no pone uno propio. */
  tituloPorDefecto: string;
  descripcion: string;
  /** Lo que carga el dueño del negocio para que esta ficha tenga contenido. */
  queCarga: string[];
  /** Usa productos (y por eso los campos extra de la categoría). */
  usaProductos: boolean;
}

export const TIPOS_FICHA: TipoFicha[] = ["menu", "catalogo", "servicios", "rubros", "ofertas", "galeria"];

export const FICHAS: Record<TipoFicha, InfoFicha> = {
  menu: {
    nombre: "Menú",
    tituloPorDefecto: "Menú",
    descripcion: "Platos o productos agrupados por secciones, con foto a la izquierda.",
    queCarga: ["Nombre y descripción", "Precio", "Foto", "Sección (Entradas, Fondos…)"],
    usaProductos: true,
  },
  catalogo: {
    nombre: "Catálogo",
    tituloPorDefecto: "Catálogo",
    descripcion: "Grilla de fotos grandes, para productos que se eligen por cómo se ven.",
    queCarga: ["Nombre y descripción", "Precio", "Foto", "Sección"],
    usaProductos: true,
  },
  servicios: {
    nombre: "Servicios y tarifas",
    tituloPorDefecto: "Servicios y tarifas",
    descripcion: "Lista de servicios con su precio a la derecha. Foto opcional.",
    queCarga: ["Nombre del servicio", "Detalle corto", "Precio", "Foto (opcional)"],
    usaProductos: false,
  },
  rubros: {
    nombre: "Rubros",
    tituloPorDefecto: "Qué encuentras aquí",
    descripcion: "Solo los rubros que maneja el local, sin precios. Para tiendas con miles de productos.",
    queCarga: ["Lista de rubros"],
    usaProductos: false,
  },
  ofertas: {
    nombre: "Ofertas y pasillos",
    tituloPorDefecto: "Ofertas de la semana",
    descripcion: "Carrusel de ofertas con precio tachado, y los pasillos del local.",
    queCarga: ["Oferta: nombre, precio y precio anterior", "Etiqueta (Oferta, Del día…)", "Pasillos"],
    usaProductos: false,
  },
  galeria: {
    nombre: "Galería",
    tituloPorDefecto: "Fotos del negocio",
    descripcion: "Hasta 6 fotos del trabajo o del local. Para quien no maneja una lista de precios.",
    queCarga: ["Hasta 6 fotos"],
    usaProductos: false,
  },
};

/** Título que ve el vecino encima del contenido de la ficha. */
export function tituloSeccionFicha(ficha: TipoFicha, tituloPropio?: string | null): string {
  return tituloPropio?.trim() || FICHAS[ficha].tituloPorDefecto;
}
