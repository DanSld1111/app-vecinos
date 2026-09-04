import { create } from "zustand";
import { entorno } from "../config/entorno";

export interface UsuarioSesion {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  comunidadId: string;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  comunidadId: string;
  contrasena: string;
}

interface RespuestaAuth {
  token: string;
  usuario: UsuarioSesion;
}

interface EstadoSesion {
  autenticado: boolean;
  usuario: UsuarioSesion | null;
  token: string | null;
  cargando: boolean;
  error: string | null;
  registrar: (datos: DatosRegistro) => Promise<boolean>;
  iniciarSesion: (correo: string, contrasena: string) => Promise<boolean>;
  olvideClave: (correo: string) => Promise<boolean>;
  restablecerClave: (correo: string, codigo: string, nuevaContrasena: string) => Promise<boolean>;
  continuarComoInvitado: () => void;
  cerrarSesion: () => void;
  limpiarError: () => void;
}

async function llamarAuthVecino<T>(ruta: string, cuerpo: object): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiUrl}/auth/vecino/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error("No pudimos conectarnos al servidor. Revisa tu conexión e intenta de nuevo.");
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new Error(mensaje ?? "No se pudo completar la solicitud.");
  }
  return datos as T;
}

export const useSesion = create<EstadoSesion>((set) => ({
  autenticado: false,
  usuario: null,
  token: null,
  cargando: false,
  error: null,

  registrar: async (datos) => {
    set({ cargando: true, error: null });
    try {
      const { token, usuario } = await llamarAuthVecino<RespuestaAuth>("registro", datos);
      set({ autenticado: true, usuario, token, cargando: false });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo crear la cuenta.", cargando: false });
      return false;
    }
  },

  iniciarSesion: async (correo, contrasena) => {
    set({ cargando: true, error: null });
    try {
      const { token, usuario } = await llamarAuthVecino<RespuestaAuth>("iniciar-sesion", { correo, contrasena });
      set({ autenticado: true, usuario, token, cargando: false });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo iniciar sesión.", cargando: false });
      return false;
    }
  },

  olvideClave: async (correo) => {
    set({ cargando: true, error: null });
    try {
      await llamarAuthVecino("olvide-clave", { correo });
      set({ cargando: false });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo procesar la solicitud.", cargando: false });
      return false;
    }
  },

  restablecerClave: async (correo, codigo, nuevaContrasena) => {
    set({ cargando: true, error: null });
    try {
      await llamarAuthVecino("restablecer-clave", { correo, codigo, nuevaContrasena });
      set({ cargando: false });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo restablecer la contraseña.", cargando: false });
      return false;
    }
  },

  continuarComoInvitado: () => set({ autenticado: true, usuario: null, token: null, error: null }),

  cerrarSesion: () =>
    set((estado) => {
      // Borra el token de push guardado en el servidor antes de perder el de sesión — si no,
      // quedaría enviando notificaciones a un celular donde ya nadie iba a verlas con esa
      // cuenta. Best-effort: si falla (sin red, etc.) no bloquea el cierre de sesión.
      if (estado.token) {
        const tokenSesion = estado.token;
        fetch(`${entorno.apiUrl}/auth/vecino/push-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenSesion}` },
          body: JSON.stringify({ pushToken: null }),
        }).catch(() => {});
      }
      return { autenticado: false, usuario: null, token: null, error: null };
    }),

  limpiarError: () => set({ error: null }),
}));
