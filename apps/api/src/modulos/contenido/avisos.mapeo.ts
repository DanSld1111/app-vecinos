import { Aviso } from "@app-vecinos/tipos";

export interface FilaAviso {
  id: string;
  comunidad_id: string;
  fuente_nombre: string;
  fuente_verificada: boolean;
  titulo: string;
  cuerpo: string;
  categoria: Aviso["categoria"];
  estado: Aviso["estado"];
  creado_por_cuenta_id: string;
  validado_por_cuenta_id: string | null;
  motivo_rechazo: string | null;
  publicado_en: string;
  imagen_url: string | null;
  me_gusta: number;
  compartidos: number;
  distrito_ubigeo: string;
}

export const SELECT_AVISO = `
  SELECT a.id, a.comunidad_id, a.fuente_nombre, a.fuente_verificada, a.titulo, a.cuerpo, a.categoria,
         a.estado, a.creado_por_cuenta_id, a.validado_por_cuenta_id, a.motivo_rechazo, a.publicado_en,
         a.imagen_url, a.me_gusta, a.compartidos, c.distrito_ubigeo
  FROM avisos a
  JOIN comunidades c ON c.id = a.comunidad_id
`;

export function aAviso(fila: FilaAviso): Aviso {
  return {
    id: fila.id,
    comunidadId: fila.comunidad_id,
    fuenteNombre: fila.fuente_nombre,
    fuenteVerificada: fila.fuente_verificada,
    titulo: fila.titulo,
    cuerpo: fila.cuerpo,
    categoria: fila.categoria,
    estado: fila.estado,
    creadoPorCuentaId: fila.creado_por_cuenta_id,
    validadoPorCuentaId: fila.validado_por_cuenta_id,
    motivoRechazo: fila.motivo_rechazo,
    publicadoEn: fila.publicado_en,
    imagenUrl: fila.imagen_url,
    meGusta: fila.me_gusta,
    compartidos: fila.compartidos,
  };
}
