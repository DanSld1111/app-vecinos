import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cuenta } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi, registrarManejadorSesionExpirada } from "../datos/api/clienteApi";

/**
 * Sesión de "modo gestión" — para dueño de negocio y junta vecinal, que publican
 * contenido desde la app. Es un sistema de cuentas totalmente aparte del de
 * `useSesion` (vecino): usa `/auth/iniciar-sesion` (no `/auth/vecino/...`) y un
 * token JWT distinto (`JWT_SECRET`, no `JWT_SECRET_VECINO`) — igual que en
 * `apps/admin`, a propósito no son intercambiables.
 */
interface EstadoSesionCuenta {
  cuenta: Cuenta | null;
  token: string | null;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (correo: string, contrasena: string) => Promise<boolean>;
  olvideClave: (correo: string) => Promise<boolean>;
  restablecerClave: (correo: string, codigo: string, nuevaContrasena: string) => Promise<boolean>;
  cerrarSesion: () => void;
  /** Igual que cerrarSesion(), pero con un mensaje explicando por qué — la llama clienteApi.ts
   * cuando este mismo token recibe un 401 en cualquier petición autenticada del modo gestión
   * (token vencido, o la cuenta se desactivó/eliminó a mitad de sesión). Ver
   * docs/decisiones/0021-endurecimiento-post-diagnostico.md. */
  sesionExpiro: () => void;
  limpiarError: () => void;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

/**
 * `persist` guarda `cuenta`/`token` con AsyncStorage (en web usa localStorage por debajo) —
 * sin esto, salir de la pantalla "Mi cuenta" (modo gestión) y volver a entrar, o recargar la
 * app, cerraba la sesión aunque el token siguiera siendo válido, porque el store de zustand
 * vive solo en memoria. Mismo criterio que apps/admin/src/estado/useSesionAdmin.ts — no se
 * persiste `cargando`/`error` (son de una petición puntual, no de la sesión), y no hace falta
 * validar el token al cargar: si venció, la primera petición autenticada que falle con 401
 * dispara igual `sesionExpiro()` más abajo.
 */
export const useSesionCuenta = create<EstadoSesionCuenta>()(
  persist(
    (set) => ({
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
          if (cuenta.rol !== "dueno_negocio" && cuenta.rol !== "junta_vecinal") {
            set({
              error: "Esta cuenta no es de dueño de negocio ni de junta vecinal — usa el panel de administración.",
              cargando: false,
            });
            return false;
          }
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

      cerrarSesion: () => set({ cuenta: null, token: null, error: null }),
      sesionExpiro: () => set({ cuenta: null, token: null, error: "Tu sesión expiró — vuelve a ingresar." }),
      limpiarError: () => set({ error: null }),
    }),
    {
      name: "elisur-modo-gestion-sesion",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (estado) => ({ cuenta: estado.cuenta, token: estado.token }),
    },
  ),
);

// Se registra al importar este módulo, una sola vez — compara el token que vino con el que
// esta sesión tiene guardado, para no cerrar por error la sesión de vecino (useSesion.ts) si
// alguna vez llegara a compartir el mismo apiFetch.
registrarManejadorSesionExpirada((tokenUsado) => {
  if (useSesionCuenta.getState().token === tokenUsado) {
    useSesionCuenta.getState().sesionExpiro();
  }
});
