import { Resena } from "@app-vecinos/tipos";

export interface FilaResena {
  id: string;
  negocio_id: string;
  usuario_id: string;
  usuario_nombre: string;
  // numeric(2,1) en la base — node-pg lo devuelve como string para no perder precisión, no como
  // number directo (mismo criterio que promedio en resenas.service.ts::resumen()).
  calificacion: string;
  comentario: string | null;
  creado_en: string;
  actualizado_en: string;
}

export const SELECT_RESENA = `
  SELECT r.id, r.negocio_id, r.usuario_id, u.nombre AS usuario_nombre, r.calificacion,
         r.comentario, r.creado_en, r.actualizado_en
  FROM resenas r
  JOIN usuarios_app u ON u.id = r.usuario_id
`;

export function aResena(fila: FilaResena): Resena {
  return {
    id: fila.id,
    negocioId: fila.negocio_id,
    usuarioId: fila.usuario_id,
    usuarioNombre: fila.usuario_nombre,
    calificacion: Number(fila.calificacion) as Resena["calificacion"],
    comentario: fila.comentario,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}
