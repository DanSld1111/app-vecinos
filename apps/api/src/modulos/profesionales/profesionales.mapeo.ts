import { Profesional } from "@app-vecinos/tipos";

export interface FilaProfesional {
  id: string;
  comunidad_id: string;
  tipo: Profesional["tipo"];
  nombre: string;
  colegiatura_numero: string;
  colegiatura_entidad: string;
  colegiatura_verificada_en: string | null;
  especialidad: string;
  whatsapp: string;
  direccion_consultorio: string;
  activo: boolean;
  lat: number;
  lng: number;
}

export const COLUMNAS_PROFESIONAL = `
  id, comunidad_id, tipo, nombre, colegiatura_numero, colegiatura_entidad,
  colegiatura_verificada_en, especialidad, whatsapp, direccion_consultorio, activo,
  ST_Y(coordenada::geometry) AS lat, ST_X(coordenada::geometry) AS lng
`;

export function aProfesional(fila: FilaProfesional): Profesional {
  return {
    id: fila.id,
    comunidadId: fila.comunidad_id,
    tipo: fila.tipo,
    nombre: fila.nombre,
    colegiaturaNumero: fila.colegiatura_numero,
    colegiaturaEntidad: fila.colegiatura_entidad,
    colegiaturaVerificadaEn: fila.colegiatura_verificada_en,
    especialidad: fila.especialidad,
    whatsapp: fila.whatsapp,
    direccionConsultorio: fila.direccion_consultorio,
    coordenada: { lat: fila.lat, lng: fila.lng },
    activo: fila.activo,
  };
}
