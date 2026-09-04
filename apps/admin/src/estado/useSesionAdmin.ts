import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cuenta } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi, registrarManejadorSesionExpirada } from "../datos/clienteApi";

interface EstadoSesionAdmin {
  cuenta: Cuenta | null;
  token: string | null;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (correo: string, contrasena: string) => Promise<boolean>;
  olvideClave: (correo: string) => Promise<boolean>;
  restablecerClave: (correo: string, codigo: string, nuevaContrasena: string) => Promise<boolean>;
  cerrarSesion: () => void;
  /** Autoservicio "Mi cuenta" — cualquier rol edita lo suyo, nunca el correo (es el login). */
  actualizarPerfilPropio: (nombre: string) => Promise<boolean>;
  cambiarClavePropia: (claveActual: string, claveNueva: string) => Promise<boolean>;
  subirFotoPropia: (archivo: File) => Promise<boolean>;
  /** Cierra sesión igual que cerrarSesion(), pero dejando un mensaje explicando por qué —
   * la llama clienteApi.ts cuando cualquier petición autenticada devuelve 401 a mitad de
   * sesión (token vencido, o la cuenta se desactivó/eliminó). Ver
   * docs/decisiones/0021-endurecimiento-post-diagnostico.md. */
  sesionExpiro: () => void;
  limpiarError: () => void;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

/**
 * `persist` guarda `cuenta`/`token` en localStorage — sin esto, cualquier F5 o recarga cerraba
 * la sesión, porque el store de zustand vive solo en memoria y se reinicia con la página. Si el
 * token guardado ya venció (o la cuenta se desactivó), la primera petición autenticada que falle
 * con 401 dispara igual `sesionExpiro()` (ver más abajo) — no hace falta validarlo acá al cargar.
 */
export const useSesionAdmin = create<EstadoSesionAdmin>()(
  persist(
    (set, get) => ({
      cuenta: null,
      token: null,
      cargando: false,
      error: null,

      iniciarSesion: async (correo, contrasena) => {
        set({ cargando: true, error: null });
        try {
          const { token, cuenta } = await apiFetch<{ token: string; cuenta: Cuenta }>("/auth/iniciar-sesion", {
            metodo: "POST",
            cuerpo: { correo, contrasena },
          });
          set({ cuenta, token, cargando: false });
          return true;
        } catch (error) {
          set({ error: mensajeError(error, "No se pudo iniciar sesión."), cargando: false });
          return false;
        }
      },

      olvideClave: async (correo) => {
        set({ cargando: true, error: null });
        try {
          await apiFetch("/auth/olvide-clave", { metodo: "POST", cuerpo: { correo } });
          set({ cargando: false });
          return true;
        } catch (error) {
          set({ error: mensajeError(error, "No se pudo procesar la solicitud."), cargando: false });
          return false;
        }
      },

      restablecerClave: async (correo, codigo, nuevaContrasena) => {
        set({ cargando: true, error: null });
        try {
          await apiFetch("/auth/restablecer-clave", { metodo: "POST", cuerpo: { correo, codigo, nuevaContrasena } });
          set({ cargando: false });
          return true;
        } catch (error) {
          set({ error: mensajeError(error, "No se pudo restablecer la contraseña."), cargando: false });
          return false;
        }
      },

      actualizarPerfilPropio: async (nombre) => {
        const token = get().token;
        if (!token) return false;
        set({ cargando: true, error: null });
        try {
          const cuenta = await apiFetch<Cuenta>("/cuentas/yo", { metodo: "PUT", token, cuerpo: { nombre } });
          set({ cuenta, cargando: false });
          return true;
        } catch (error) {
          set({ error: mensajeError(error, "No se pudo guardar tu perfil."), cargando: false });
          return false;
        }
      },

      cambiarClavePropia: async (claveActual, claveNueva) => {
        const token = get().token;
        if (!token) return false;
        set({ cargando: true, error: null });
        try {
          await apiFetch("/cuentas/yo/clave", { metodo: "POST", token, cuerpo: { claveActual, claveNueva } });
          set({ cargando: false });
          return true;
        } catch (error) {
          set({ error: mensajeError(error, "No se pudo cambiar tu contraseña."), cargando: false });
          return false;
        }
      },

      subirFotoPropia: async (archivo) => {
        const token = get().token;
        if (!token) return false;
        set({ cargando: true, error: null });
        try {
          const cuenta = await apiSubirArchivo<Cuenta>("/cuentas/yo/foto", archivo, token);
          set({ cuenta, cargando: false });
          return true;
        } catch (error) {
          set({ error: mensajeError(error, "No se pudo subir tu foto."), cargando: false });
          return false;
        }
      },

      cerrarSesion: () => set({ cuenta: null, token: null, error: null }),
      sesionExpiro: () =>
        set({ cuenta: null, token: null, error: "Tu sesión expiró — vuelve a ingresar." }),
      limpiarError: () => set({ error: null }),
    }),
    {
      name: "elisur-admin-sesion",
      // Nunca persistir `cargando`/`error` — son estado de una sola petición, no de sesión;
      // si quedaran guardados, un F5 a mitad de un pedido podría reabrir con un error viejo.
      partialize: (estado) => ({ cuenta: estado.cuenta, token: estado.token }),
    },
  ),
);

// No se registra dentro de create() porque el manejador necesita el store ya creado
// (useSesionAdmin.getState()) — se hace acá, al importar este módulo una sola vez.
registrarManejadorSesionExpirada(() => useSesionAdmin.getState().sesionExpiro());
