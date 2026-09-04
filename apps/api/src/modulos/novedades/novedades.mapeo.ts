import { Novedad } from "@app-vecinos/tipos";

export interface FilaNovedad {
  id: string;
  titulo: string;
  texto: string;
  publicado_en: string;
  activo: boolean;
}

export const COLUMNAS_NOVEDAD = "id, titulo, texto, publicado_en, activo";

export function aNovedad(fila: FilaNovedad): Novedad {
  return {
    id: fila.id,
    titulo: fila.titulo,
    texto: fila.texto,
    publicadoEn: fila.publicado_en,
    activo: fila.activo,
  };
}
