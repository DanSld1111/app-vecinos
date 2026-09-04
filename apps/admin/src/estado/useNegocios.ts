import { create } from "zustand";
import { Horarios, Negocio, OfertaNegocio, Producto, ResultadoPaginado } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi } from "../datos/clienteApi";

type NegocioNuevo = Pick<
  Negocio,
  "nombre" | "distritoUbigeo" | "comunidadId" | "categoriaIds" | "direccion" | "telefono" | "whatsapp"
>;

type InfoEditable = Pick<
  Negocio,
  "nombre" | "descripcion" | "categoriaIds" | "direccion" | "telefono" | "whatsapp"
>;

interface EstadoNegocios {
  negocios: Negocio[];
  cargando: boolean;
  cargandoMas: boolean;
  /** null = no hay más páginas (o todavía no se cargó nada) — solo lo usa cargarAdmin, el
   * único listado de negocios que hoy pagina. Ver docs/decisiones/0021-endurecimiento-post-diagnostico.md. */
  cursorSiguiente: string | null;
  error: string | null;
  /** Dueño de negocio: solo los suyos, sin importar su estado. */
  cargarMios: (token: string) => Promise<void>;
  /** Panel del super-admin: todos los negocios, sin importar su estado. */
  cargarAdmin: (token: string) => Promise<void>;
  cargarMasAdmin: (token: string) => Promise<void>;
  /** Cola de validación: solo por_verificar, ya acotados por el servidor al alcance de la cuenta. */
  cargarPendientes: (token: string) => Promise<void>;
  /** Historial: ya resueltos, acotados por el servidor al alcance de la cuenta. */
  cargarHistorial: (token: string) => Promise<void>;
  crear: (datos: NegocioNuevo, token: string) => Promise<string | null>;
  aprobar: (id: string, token: string) => Promise<void>;
  rechazar: (id: string, motivo: string, token: string) => Promise<void>;
  actualizarInfo: (id: string, datos: InfoEditable, token: string) => Promise<boolean>;
  actualizarHorarios: (id: string, horarios: Horarios, token: string) => Promise<boolean>;
  agregarOferta: (id: string, oferta: OfertaNegocio, token: string) => Promise<void>;
  eliminarOferta: (id: string, indice: number, token: string) => Promise<void>;
  subirFoto: (id: string, archivo: File, token: string) => Promise<boolean>;
  /** Solo pone/cambia la foto de un producto que ya existe — todavía no hay alta/edición de productos desde el panel. */
  subirFotoProducto: (negocioId: string, productoId: string, archivo: File, token: string) => Promise<Producto | null>;
  agregarFotoGaleria: (id: string, archivo: File, token: string) => Promise<boolean>;
  eliminarFotoGaleria: (id: string, url: string, token: string) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useNegocios = create<EstadoNegocios>((set, get) => ({
  negocios: [],
  cargando: false,
  cargandoMas: false,
  cursorSiguiente: null,
  error: null,

  cargarMios: async (token) => {
    set({ cargando: true, error: null });
    try {
      const negocios = await apiFetch<Negocio[]>("/negocios/mios", { token });
      set({ negocios, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar tus negocios."), cargando: false });
    }
  },

  cargarAdmin: async (token) => {
    set({ cargando: true, error: null });
    try {
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<Negocio>>("/negocios/admin", { token });
      set({ negocios: items, cursorSiguiente, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los negocios."), cargando: false });
    }
  },

  cargarMasAdmin: async (token) => {
    const cursor = get().cursorSiguiente;
    if (!cursor) return;
    set({ cargandoMas: true });
    try {
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<Negocio>>(
        `/negocios/admin?cursor=${encodeURIComponent(cursor)}`,
        { token },
      );
      set((estado) => ({ negocios: [...estado.negocios, ...items], cursorSiguiente, cargandoMas: false }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar más negocios."), cargandoMas: false });
    }
  },

  cargarPendientes: async (token) => {
    set({ cargando: true, error: null });
    try {
      const negocios = await apiFetch<Negocio[]>("/negocios/pendientes", { token });
      set({ negocios, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los negocios pendientes."), cargando: false });
    }
  },

  cargarHistorial: async (token) => {
    set({ cargando: true, error: null });
    try {
      const negocios = await apiFetch<Negocio[]>("/negocios/historial", { token });
      set({ negocios, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo cargar el historial de negocios."), cargando: false });
    }
  },

  crear: async (datos, token) => {
    try {
      const nuevo = await apiFetch<Negocio>("/negocios", { metodo: "POST", token, cuerpo: datos });
      set((estado) => ({ negocios: [nuevo, ...estado.negocios] }));
      return nuevo.id;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo crear el negocio.") });
      return null;
    }
  },

  aprobar: async (id, token) => {
    try {
      await apiFetch<Negocio>(`/negocios/${id}/aprobar`, { metodo: "PATCH", token });
      // Se saca de la lista en vez de actualizarlo en el sitio: este store solo tiene sentido
      // acá poblado con "pendientes" (GET /negocios/pendientes) — una vez aprobado ya no es
      // parte de esa lista, igual que ya hace useAvisos.aprobar/rechazar.
      set((estado) => ({ negocios: estado.negocios.filter((n) => n.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo aprobar el negocio.") });
    }
  },

  rechazar: async (id, motivo, token) => {
    try {
      await apiFetch<Negocio>(`/negocios/${id}/rechazar`, {
        metodo: "PATCH",
        token,
        cuerpo: { motivo },
      });
      set((estado) => ({ negocios: estado.negocios.filter((n) => n.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo rechazar el negocio.") });
    }
  },

  actualizarInfo: async (id, datos, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/info`, { metodo: "PUT", token, cuerpo: datos });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar la información del negocio.") });
      return false;
    }
  },

  actualizarHorarios: async (id, horarios, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/horarios`, {
        metodo: "PUT",
        token,
        cuerpo: horarios,
      });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar el horario.") });
      return false;
    }
  },

  agregarOferta: async (id, oferta, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/ofertas`, {
        metodo: "POST",
        token,
        cuerpo: oferta,
      });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo agregar la oferta.") });
    }
  },

  eliminarOferta: async (id, indice, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/ofertas/${indice}`, {
        metodo: "DELETE",
        token,
      });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar la oferta.") });
    }
  },

  subirFoto: async (id, archivo, token) => {
    try {
      const actualizado = await apiSubirArchivo<Negocio>(`/negocios/${id}/foto`, archivo, token);
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo subir la foto.") });
      return false;
    }
  },

  subirFotoProducto: async (negocioId, productoId, archivo, token) => {
    try {
      return await apiSubirArchivo<Producto>(`/negocios/${negocioId}/productos/${productoId}/foto`, archivo, token);
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo subir la foto del producto.") });
      return null;
    }
  },

  agregarFotoGaleria: async (id, archivo, token) => {
    try {
      const actualizado = await apiSubirArchivo<Negocio>(`/negocios/${id}/galeria`, archivo, token);
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo subir la foto a la galería.") });
      return false;
    }
  },

  eliminarFotoGaleria: async (id, url, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/galeria`, {
        metodo: "DELETE",
        token,
        cuerpo: { url },
      });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo borrar la foto de la galería.") });
      return false;
    }
  },
}));
