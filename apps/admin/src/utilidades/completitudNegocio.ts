import { Categoria, Negocio, TipoFicha } from "@app-vecinos/tipos";
import { fichaDelNegocio } from "./fichaNegocio";

/** Pestaña de la ficha del negocio donde se completa cada parte ("" = Información). */
export type PestanaParte = "" | "horario" | "fotos" | "dueno" | "productos" | "servicios" | "rubros" | "ofertas";

export interface ParteFicha {
  clave: "foto" | "horario" | "descripcion" | "categoria" | "dueno" | "contenido";
  icono: string;
  etiqueta: string;
  completa: boolean;
  pestana: PestanaParte;
}

// Sin el dato (servidor todavía sin actualizar) no se marca como faltante: mejor no avisar que avisar mal.
const tieneProductos = (n: Negocio) => n.totalProductos === undefined || n.totalProductos > 0;

/** Qué contenido pide cada ficha, cómo se nombra y dónde se carga (decisión 0085). */
const CONTENIDO: Record<TipoFicha, { etiqueta: string; pestana: PestanaParte; tiene: (n: Negocio) => boolean }> = {
  menu: { etiqueta: "productos", pestana: "productos", tiene: tieneProductos },
  catalogo: { etiqueta: "productos", pestana: "productos", tiene: tieneProductos },
  servicios: { etiqueta: "servicios", pestana: "servicios", tiene: (n) => Boolean(n.serviciosOfrecidos?.length) },
  rubros: { etiqueta: "rubros", pestana: "rubros", tiene: (n) => Boolean(n.rubrosDisponibles?.length) },
  ofertas: { etiqueta: "ofertas", pestana: "ofertas", tiene: (n) => Boolean(n.ofertas?.length || n.pasillos?.length) },
  galeria: { etiqueta: "fotos de la galería", pestana: "fotos", tiene: (n) => n.fotosGaleria.length > 0 },
};

/**
 * Qué le falta a la ficha de un negocio para estar realmente usable en la app. El listado del
 * panel lo usa para que se vea de un vistazo cuáles están a medias.
 *
 * La sexta parte, "contenido", depende de la ficha de su categoría (decisión 0085): productos en
 * Menú y Catálogo, servicios, rubros, ofertas o fotos de la galería. Así una lavandería no queda
 * incompleta por no tener carta, pero sí si no cargó sus servicios. Mientras las categorías no se
 * cargan no se puede saber qué pide, y esa parte no se cuenta.
 */
export function partesDeFicha(negocio: Negocio, tieneDueno: boolean, categorias: Categoria[] = []): ParteFicha[] {
  const tieneHorario = Object.values(negocio.horarios ?? {}).some((dia) => !dia.cerrado);
  const partes: ParteFicha[] = [
    { clave: "foto", icono: "📷", etiqueta: "foto", completa: Boolean(negocio.fotoPrincipalUrl), pestana: "fotos" },
    { clave: "horario", icono: "🕒", etiqueta: "horario", completa: tieneHorario, pestana: "horario" },
    { clave: "descripcion", icono: "📝", etiqueta: "descripción", completa: negocio.descripcion.trim() !== "", pestana: "" },
    { clave: "categoria", icono: "🏷️", etiqueta: "categoría", completa: negocio.categoriaIds.length > 0, pestana: "" },
    { clave: "dueno", icono: "👤", etiqueta: "dueño", completa: tieneDueno, pestana: "dueno" },
  ];
  if (categorias.length > 0 && negocio.categoriaIds.length > 0) {
    const contenido = CONTENIDO[fichaDelNegocio(negocio, categorias).ficha];
    partes.push({ clave: "contenido", icono: "📦", etiqueta: contenido.etiqueta, completa: contenido.tiene(negocio), pestana: contenido.pestana });
  }
  return partes;
}

export function fichaCompleta(negocio: Negocio, tieneDueno: boolean, categorias: Categoria[] = []): boolean {
  return partesDeFicha(negocio, tieneDueno, categorias).every((p) => p.completa);
}
