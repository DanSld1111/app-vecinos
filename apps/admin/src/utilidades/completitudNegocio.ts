import { Negocio } from "@app-vecinos/tipos";

export interface ParteFicha {
  clave: "foto" | "horario" | "descripcion" | "categoria" | "dueno";
  icono: string;
  etiqueta: string;
  completa: boolean;
}

/**
 * Qué le falta a la ficha de un negocio para estar realmente usable en la app. El listado del
 * panel lo usa para que se vea de un vistazo cuáles están a medias — antes había que entrar a
 * cada una para enterarse.
 *
 * Los productos no entran en la cuenta a propósito: no todos los negocios tienen carta
 * (una lavandería, una inmobiliaria), así que exigirlos marcaría como incompletas fichas que
 * en realidad están terminadas.
 */
export function partesDeFicha(negocio: Negocio, tieneDueno: boolean): ParteFicha[] {
  const tieneHorario = Object.values(negocio.horarios ?? {}).some((dia) => !dia.cerrado);
  return [
    { clave: "foto", icono: "📷", etiqueta: "foto", completa: Boolean(negocio.fotoPrincipalUrl) },
    { clave: "horario", icono: "🕒", etiqueta: "horario", completa: tieneHorario },
    { clave: "descripcion", icono: "📝", etiqueta: "descripción", completa: negocio.descripcion.trim() !== "" },
    { clave: "categoria", icono: "🏷️", etiqueta: "categoría", completa: negocio.categoriaIds.length > 0 },
    { clave: "dueno", icono: "👤", etiqueta: "dueño", completa: tieneDueno },
  ];
}

export function fichaCompleta(negocio: Negocio, tieneDueno: boolean): boolean {
  return partesDeFicha(negocio, tieneDueno).every((p) => p.completa);
}

/** "Falta foto, horario y dueño" — en lenguaje natural, no una lista de íconos rojos. */
export function resumenDeLoQueFalta(negocio: Negocio, tieneDueno: boolean): string | null {
  const faltantes = partesDeFicha(negocio, tieneDueno)
    .filter((p) => !p.completa)
    .map((p) => p.etiqueta);
  if (faltantes.length === 0) return null;
  if (faltantes.length === 1) return `Falta ${faltantes[0]}`;
  const ultima = faltantes.pop();
  return `Falta ${faltantes.join(", ")} y ${ultima}`;
}
