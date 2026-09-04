import { create } from "zustand";
import { Cuenta, ResultadoPaginado, RolCuenta } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/clienteApi";

interface DatosCuenta {
  nombre: string;
  correo: string;
  rol: RolCuenta;
  negocioIds: string[];
  distritosAsignados: string[];
}

interface EstadoCuentas {
  cuentas: Cuenta[];
  cargando: boolean;
  cargandoMas: boolean;
  /** null = no hay más páginas (o todavía no se cargó nada). Antes el listado traía todo de
   * una sola vez, sin límite — ver docs/decisiones/0021-endurecimiento-post-diagnostico.md. */
  cursorSiguiente: string | null;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  cargarMas: (token: string) => Promise<void>;
  crear: (datos: DatosCuenta, contrasena: string, token: string) => Promise<boolean>;
  actualizar: (id: string, datos: DatosCuenta, token: string) => Promise<boolean>;
  eliminar: (id: string, token: string) => Promise<boolean>;
  alternarActivo: (id: string, token: string) => Promise<void>;
  agregarNegocio: (cuentaId: string, negocioId: string, token: string) => Promise<void>;
  quitarNegocio: (cuentaId: string, negocioId: string, token: string) => Promise<void>;
  restablecerClave: (id: string, nuevaContrasena: string, token: string) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useCuentas = create<EstadoCuentas>((set, get) => ({
  cuentas: [],
  cargando: false,
  cargandoMas: false,
  cursorSiguiente: null,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<Cuenta>>("/cuentas", { token });
      set({ cuentas: items, cursorSiguiente, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar las cuentas."), cargando: false });
    }
  },

  cargarMas: async (token) => {
    const cursor = get().cursorSiguiente;
    if (!cursor) return;
    set({ cargandoMas: true });
    try {
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<Cuenta>>(
        `/cuentas?cursor=${encodeURIComponent(cursor)}`,
        { token },
      );
      set((estado) => ({ cuentas: [...estado.cuentas, ...items], cursorSiguiente, cargandoMas: false }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar más cuentas."), cargandoMas: false });
    }
  },

  crear: async (datos, contrasena, token) => {
    try {
      const nueva = await apiFetch<Cuenta>("/cuentas", {
        metodo: "POST",
        token,
        cuerpo: { ...datos, contrasena },
      });
      set((estado) => ({ cuentas: [...estado.cuentas, nueva] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo crear la cuenta.") });
      return false;
    }
  },

  actualizar: async (id, datos, token) => {
    try {
      const actualizada = await apiFetch<Cuenta>(`/cuentas/${id}`, { metodo: "PUT", token, cuerpo: datos });
      set((estado) => ({ cuentas: estado.cuentas.map((c) => (c.id === id ? actualizada : c)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo actualizar la cuenta.") });
      return false;
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch(`/cuentas/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ cuentas: estado.cuentas.filter((c) => c.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar la cuenta.") });
      return false;
    }
  },

  restablecerClave: async (id, nuevaContrasena, token) => {
    try {
      await apiFetch(`/cuentas/${id}/restablecer-clave`, {
        metodo: "POST",
        token,
        cuerpo: { nuevaContrasena },
      });
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo restablecer la contraseña.") });
      return false;
    }
  },

  alternarActivo: async (id, token) => {
    try {
      const actualizada = await apiFetch<Cuenta>(`/cuentas/${id}/alternar-activo`, { metodo: "PATCH", token });
      set((estado) => ({ cuentas: estado.cuentas.map((c) => (c.id === id ? actualizada : c)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo cambiar el estado de la cuenta.") });
    }
  },

  // Sin endpoint propio: PUT /cuentas/:id reemplaza el array completo de negocios asignados
  // (ver docs/decisiones/0007-modulo-cuentas-auth.md). Estas dos funciones arman ese array
  // completo a partir del estado actual y llaman al mismo "actualizar".
  agregarNegocio: async (cuentaId, negocioId, token) => {
    const cuenta = get().cuentas.find((c) => c.id === cuentaId);
    if (!cuenta || cuenta.negocioIds.includes(negocioId)) return;
    await get().actualizar(cuentaId, { ...cuenta, negocioIds: [...cuenta.negocioIds, negocioId] }, token);
  },

  quitarNegocio: async (cuentaId, negocioId, token) => {
    const cuenta = get().cuentas.find((c) => c.id === cuentaId);
    if (!cuenta) return;
    await get().actualizar(
      cuentaId,
      { ...cuenta, negocioIds: cuenta.negocioIds.filter((id) => id !== negocioId) },
      token,
    );
  },
}));
