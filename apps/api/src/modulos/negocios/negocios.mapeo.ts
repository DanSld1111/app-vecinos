import { Negocio, Horarios, Moneda } from "@app-vecinos/tipos";

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
  moneda: Moneda;
  foto_principal_url: string | null;
  estado: Negocio["estado"];
  archivado_en: string | null;
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
  visitas_7d: string;
  /** Solo presente cuando la consulta la calculó (ver `listar()` con `lat`/`lng`). */
  distancia_m?: string | null;
  acerca_del_negocio: string | null;
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
    moneda: fila.moneda,
    fotoPrincipalUrl: fila.foto_principal_url,
    estado: fila.estado,
    archivadoEn: fila.archivado_en,
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
    visitas7d: Number(fila.visitas_7d),
    distanciaM: fila.distancia_m != null ? Number(fila.distancia_m) : undefined,
    acercaDelNegocio: fila.acerca_del_negocio,
  };
}

export const COLUMNAS_NEGOCIO = `
  n.id, n.comunidad_id, n.distrito_ubigeo, n.nombre, n.descripcion, n.direccion,
  n.telefono, n.whatsapp, n.horarios, n.moneda, n.foto_principal_url, n.estado, n.archivado_en, n.verificado_en,
  n.validado_por_cuenta_id, n.motivo_rechazo, n.fuente, n.creado_en, n.actualizado_en,
  n.servicios_ofrecidos, n.rubros_disponibles, n.ofertas, n.pasillos, n.fotos_galeria, n.acerca_del_negocio,
  ST_Y(n.coordenada::geometry) AS lat, ST_X(n.coordenada::geometry) AS lng,
  COALESCE(array_agg(nc.categoria_id) FILTER (WHERE nc.categoria_id IS NOT NULL), '{}') AS categoria_ids,
  (SELECT COUNT(*) FROM negocio_visitas v WHERE v.negocio_id = n.id AND v.creado_en > now() - interval '7 days') AS visitas_7d
`;
