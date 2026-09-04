import { UsuarioApp } from "@app-vecinos/tipos";

export interface FilaUsuarioApp {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  comunidad_id: string;
  estado: UsuarioApp["estado"];
  registrado_en: string;
  ultimo_acceso_en: string | null;
}

export interface FilaUsuarioAppConHash extends FilaUsuarioApp {
  password_hash: string;
}

export const SELECT_USUARIO_APP = `
  SELECT id, nombre, apellido, correo, telefono, comunidad_id, estado, registrado_en, ultimo_acceso_en
  FROM usuarios_app
`;

export function aUsuarioApp(fila: FilaUsuarioApp): UsuarioApp {
  return {
    id: fila.id,
    nombre: fila.nombre,
    apellido: fila.apellido,
    correo: fila.correo,
    telefono: fila.telefono,
    comunidadId: fila.comunidad_id,
    estado: fila.estado,
    registradoEn: fila.registrado_en,
    ultimoAccesoEn: fila.ultimo_acceso_en,
  };
}
