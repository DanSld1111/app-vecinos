import { Arquetipo, CampoArquetipo } from "@app-vecinos/tipos";

export interface FilaArquetipo {
  id: string;
  nombre: string;
  icono: string;
  plantilla_id: string;
  origen: Arquetipo["origen"];
  campos: CampoArquetipo[];
}

export const COLUMNAS_ARQUETIPO = "id, nombre, icono, plantilla_id, origen, campos";

export function aArquetipo(fila: FilaArquetipo): Arquetipo {
  return {
    id: fila.id,
    nombre: fila.nombre,
    icono: fila.icono,
    plantillaId: fila.plantilla_id,
    origen: fila.origen,
    // node-postgres ya devuelve JSONB parseado, pero un valor legado en texto no debería tumbar la lectura.
    campos: typeof fila.campos === "string" ? JSON.parse(fila.campos) : fila.campos,
  };
}
