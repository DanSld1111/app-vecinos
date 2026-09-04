import { Negocio, Horarios } from "@app-vecinos/tipos";

export interface FilaNegocio {
  id: string;
  comunidad_id: string;
  distrito_ubigeo: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string | null;
  whatsapp: string | null;
  horarios: Horarios;
  foto_principal_url: string | null;
  estado: Negocio["estado"];
  verificado_en: string | null;
  validado_por_cuenta_id: string | null;
  motivo_rechazo: string | null;
  fuente: string;
  creado_en: string;
  actualizado_en: string;
  servicios_ofrecidos: Negocio["serviciosOfrecidos"] | null;
  rubros_disponibles: string[] | null;
  ofertas: Negocio["ofertas"] | null;
  pasillos: string[] | null;
  fotos_galeria: string[];
  lat: number;
  lng: number;
  categoria_ids: string[];
}

export function aNegocio(fila: FilaNegocio): Negocio {
  return {
    id: fila.id,
    comunidadId: fila.comunidad_id,
    distritoUbigeo: fila.distrito_ubigeo,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    categoriaIds: fila.categoria_ids,
    coordenada: { lat: fila.lat, lng: fila.lng },
    direccion: fila.direccion,
    telefono: fila.telefono,
    whatsapp: fila.whatsapp,
    horarios: fila.horarios,
    fotoPrincipalUrl: fila.foto_principal_url,
    estado: fila.estado,
    verificadoEn: fila.verificado_en,
    validadoPorCuentaId: fila.validado_por_cuenta_id,
    motivoRechazo: fila.motivo_rechazo,
    fuente: fila.fuente,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
    serviciosOfrecidos: fila.servicios_ofrecidos ?? undefined,
    rubrosDisponibles: fila.rubros_disponibles ?? undefined,
    ofertas: fila.ofertas ?? undefined,
    pasillos: fila.pasillos ?? undefined,
    fotosGaleria: fila.fotos_galeria,
  };
}

export const COLUMNAS_NEGOCIO = `
  n.id, n.comunidad_id, n.distrito_ubigeo, n.nombre, n.descripcion, n.direccion,
  n.telefono, n.whatsapp, n.horarios, n.foto_principal_url, n.estado, n.verificado_en,
  n.validado_por_cuenta_id, n.motivo_rechazo, n.fuente, n.creado_en, n.actualizado_en,
  n.servicios_ofrecidos, n.rubros_disponibles, n.ofertas, n.pasillos, n.fotos_galeria,
  ST_Y(n.coordenada::geometry) AS lat, ST_X(n.coordenada::geometry) AS lng,
  COALESCE(array_agg(nc.categoria_id) FILTER (WHERE nc.categoria_id IS NOT NULL), '{}') AS categoria_ids
`;
