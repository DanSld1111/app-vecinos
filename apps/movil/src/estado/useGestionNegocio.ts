import { create } from "zustand";
import { Horarios, Negocio, OfertaNegocio, Producto } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ArchivoImagen, ErrorApi } from "../datos/api/clienteApi";

type InfoEditable = Pick<Negocio, "nombre" | "descripcion" | "categoriaIds" | "direccion" | "telefono" | "whatsapp">;

/**
 * Autoservicio del dueño de negocio desde la app — mismos endpoints que ya usa
 * `apps/admin` (`useNegocios.ts`), solo que acá el store se limita a lo que un
 * dueño puede hacer (nada de aprobar/rechazar/crear, eso sigue siendo del panel).
 */
interface EstadoGestionNegocio {
  negocios: Negocio[];
  cargando: boolean;
  error: string | null;
  cargarMios: (token: string) => Promise<void>;
  actualizarInfo: (id: string, datos: InfoEditable, token: string) => Promise<boolean>;
  actualizarHorarios: (id: string, horarios: Horarios, token: string) => Promise<boolean>;
  agregarOferta: (id: string, oferta: OfertaNegocio, token: string) => Promise<boolean>;
  eliminarOferta: (id: string, indice: number, token: string) => Promise<boolean>;
  subirFoto: (id: string, archivo: ArchivoImagen, token: string) => Promise<boolean>;
  agregarFotoGaleria: (id: string, archivo: ArchivoImagen, token: string) => Promise<boolean>;
  eliminarFotoGaleria: (id: string, url: string, token: string) => Promise<boolean>;
  subirFotoProducto: (
    negocioId: string,
    productoId: string,
    archivo: ArchivoImagen,
    token: string,
  ) => Promise<Producto | null>;
  limpiarError: () => void;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useGestionNegocio = create<EstadoGestionNegocio>((set) => ({
  negocios: [],
  cargando: false,
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
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/horarios`, { metodo: "PUT", token, cuerpo: horarios });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar el horario.") });
      return false;
    }
  },

  agregarOferta: async (id, oferta, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/ofertas`, { metodo: "POST", token, cuerpo: oferta });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo agregar la oferta.") });
      return false;
    }
  },

  eliminarOferta: async (id, indice, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/ofertas/${indice}`, { metodo: "DELETE", token });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar la oferta.") });
      return false;
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

  agregarFotoGaleria: async (id, archivo, token) => {
    try {
      const actualizado = await apiSubirArchivo<Negocio>(`/negocios/${id}/galeria`, archivo, token);
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo agregar la foto a la galería.") });
      return false;
    }
  },

  eliminarFotoGaleria: async (id, url, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/galeria`, { metodo: "DELETE", token, cuerpo: { url } });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo borrar la foto.") });
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

  limpiarError: () => set({ error: null }),
}));
