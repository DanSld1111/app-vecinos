import { Cuenta } from "@app-vecinos/tipos";

export interface FilaCuenta {
  id: string;
  nombre: string;
  correo: string;
  rol: Cuenta["rol"];
  activo: boolean;
  creado_en: string;
  ultimo_acceso_en: string | null;
  foto_url: string | null;
  negocio_ids: string[];
  distritos_asignados: string[];
}

export interface FilaCuentaConHash extends FilaCuenta {
  password_hash: string;
}

export const SELECT_CUENTA = `
  SELECT c.id, c.nombre, c.correo, c.rol, c.activo, c.creado_en, c.ultimo_acceso_en, c.foto_url, c.password_hash,
         COALESCE(array_agg(DISTINCT cn.negocio_id) FILTER (WHERE cn.negocio_id IS NOT NULL), '{}') AS negocio_ids,
         COALESCE(array_agg(DISTINCT cd.distrito_ubigeo) FILTER (WHERE cd.distrito_ubigeo IS NOT NULL), '{}') AS distritos_asignados
  FROM cuentas c
  LEFT JOIN cuenta_negocios cn ON cn.cuenta_id = c.id
  LEFT JOIN cuenta_distritos cd ON cd.cuenta_id = c.id
`;

export function aCuenta(fila: FilaCuenta): Cuenta {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    rol: fila.rol,
    negocioIds: fila.negocio_ids,
    distritosAsignados: fila.distritos_asignados,
    activo: fila.activo,
    creadoEn: fila.creado_en,
    ultimoAccesoEn: fila.ultimo_acceso_en,
    fotoUrl: fila.foto_url,
  };
}
