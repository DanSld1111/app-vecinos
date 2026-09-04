import { Anuncio, UbicacionAnuncio } from "@app-vecinos/tipos";

export interface FilaAnuncio {
  id: string;
  nombre: string;
  detalle: string;
  imagen_url: string | null;
  ubicaciones: UbicacionAnuncio[];
  negocio_id: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  orden: number;
  activo: boolean;
}

export function aAnuncio(fila: FilaAnuncio): Anuncio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    detalle: fila.detalle,
    imagenUrl: fila.imagen_url,
    ubicaciones: fila.ubicaciones,
    negocioId: fila.negocio_id,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    orden: fila.orden,
    activo: fila.activo,
  };
}

// fecha_inicio/fecha_fin casteadas a texto: sin esto, pg devuelve DATE como un objeto Date de
// JS (medianoche UTC), y convertirlo con String()/toISOString() puede correr el día según la
// zona horaria del servidor — comparar strings "YYYY-MM-DD" tal cual evita ese problema.
// ubicaciones::text[]: el driver `pg` no tiene registrado un parser de array para el tipo enum
// `ubicacion_anuncio[]` (solo para arrays de tipos nativos) — sin el cast, cada fila llegaba
// como el string literal de Postgres ("{carrusel_inicio}") en vez de un array de JS.
export const COLUMNAS_ANUNCIO = `
  id, nombre, detalle, imagen_url, ubicaciones::text[] AS ubicaciones, negocio_id,
  to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
  to_char(fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
  orden, activo
`;
