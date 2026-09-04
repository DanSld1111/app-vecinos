import { Aviso } from "@app-vecinos/tipos";

export interface GrupoAvisos {
  etiqueta: string;
  avisos: Aviso[];
}

function diasDesde(fechaIso: string, ahora: Date): number {
  const fecha = new Date(fechaIso + "T00:00:00");
  return Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

export function agruparPorFecha(avisos: Aviso[], ahora = new Date()): GrupoAvisos[] {
  const buckets: Record<string, Aviso[]> = { Hoy: [], "Esta semana": [], Anteriores: [] };

  for (const aviso of avisos) {
    const dias = diasDesde(aviso.publicadoEn, ahora);
    if (dias <= 0) buckets["Hoy"].push(aviso);
    else if (dias < 7) buckets["Esta semana"].push(aviso);
    else buckets["Anteriores"].push(aviso);
  }

  return ["Hoy", "Esta semana", "Anteriores"]
    .filter((etiqueta) => buckets[etiqueta].length > 0)
    .map((etiqueta) => ({ etiqueta, avisos: buckets[etiqueta] }));
}
