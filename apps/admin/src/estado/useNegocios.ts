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
> &
  // Opcionales en la API: si no van, se deja lo que ya había (ver PUT :id/info).
  Partial<Pick<Negocio, "coordenada" | "moneda">>;

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
  /** Panel del super-admin/gestor: todos los negocios, sin importar su estado.
   * `soloArchivados` trae la vista "Ver archivados" en vez del listado normal. */
  cargarAdmin: (token: string, soloArchivados?: boolean) => Promise<void>;
  cargarMasAdmin: (token: string, soloArchivados?: boolean) => Promise<void>;
  /** Un negocio suelto, sin importar su estado — para abrir su ficha directo por URL. */
  cargarUno: (id: string, token: string) => Promise<Negocio | null>;
  /** Cola de validación: solo por_verificar, ya acotados por el servidor al alcance de la cuenta. */
  cargarPendientes: (token: string) => Promise<void>;
  /** Historial: ya resueltos, acotados por el servidor al alcance de la cuenta. */
  cargarHistorial: (token: string) => Promise<void>;
  crear: (datos: NegocioNuevo, token: string) => Promise<string | null>;
  aprobar: (id: string, token: string) => Promise<void>;
  /** Baja el negocio de la app sin borrarlo — se puede volver a publicar con `aprobar`. */
  despublicar: (id: string, token: string) => Promise<void>;
  rechazar: (id: string, motivo: string, token: string) => Promise<void>;
  /** Reversible: sale del listado normal, queda en "Ver archivados" hasta restaurarse. */
  archivar: (id: string, token: string) => Promise<void>;
  restaurarArchivo: (id: string, token: string) => Promise<void>;
  /** Definitivo — quita el negocio del store al confirmar el borrado en el servidor. */
  eliminar: (id: string, token: string) => Promise<boolean>;
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

  cargarAdmin: async (token, soloArchivados = false) => {
    set({ cargando: true, error: null });
    try {
      const query = soloArchivados ? "?archivados=true" : "";
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<Negocio>>(`/negocios/admin${query}`, {
        token,
      });
      set({ negocios: items, cursorSiguiente, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los negocios."), cargando: false });
    }
  },

  cargarUno: async (id, token) => {
    try {
      const negocio = await apiFetch<Negocio>(`/negocios/${id}/admin`, { token });
      // Se mezcla en la lista para que la ficha y el listado compartan la misma fuente: así
      // cualquier edición se refleja en los dos sin recargar.
      set((estado) => ({
        negocios: estado.negocios.some((n) => n.id === id)
          ? estado.negocios.map((n) => (n.id === id ? negocio : n))
          : [...estado.negocios, negocio],
      }));
      return negocio;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo cargar el negocio.") });
      return null;
    }
  },

  cargarMasAdmin: async (token, soloArchivados = false) => {
    const cursor = get().cursorSiguiente;
    if (!cursor) return;
    set({ cargandoMas: true });
    try {
      const query = `cursor=${encodeURIComponent(cursor)}${soloArchivados ? "&archivados=true" : ""}`;
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<Negocio>>(`/negocios/admin?${query}`, {
        token,
      });
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

  // Aprobar, rechazar y despublicar actualizan el negocio en el sitio, no lo sacan de la lista.
  // Antes lo quitaban, porque este store solo se usaba desde la cola de validación; ahora
  // también lo usa la ficha del panel (`/negocios/:id`), donde quitarlo dejaba la pantalla en
  // "No encontramos este negocio" justo después de publicar. La cola filtra por estado.
  aprobar: async (id, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/aprobar`, { metodo: "PATCH", token });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo aprobar el negocio.") });
    }
  },

  despublicar: async (id, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/despublicar`, { metodo: "PATCH", token });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo despublicar el negocio.") });
    }
  },

  rechazar: async (id, motivo, token) => {
    try {
      const actualizado = await apiFetch<Negocio>(`/negocios/${id}/rechazar`, {
        metodo: "PATCH",
        token,
        cuerpo: { motivo },
      });
      set((estado) => ({ negocios: estado.negocios.map((n) => (n.id === id ? actualizado : n)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo rechazar el negocio.") });
    }
  },

  archivar: async (id, token) => {
    try {
      await apiFetch<Negocio>(`/negocios/${id}/archivar`, { metodo: "PATCH", token });
      // Sale de la vista normal — el listado normal lo filtra por archivadoEn, así que se quita
      // del store en vez de solo actualizarlo (a diferencia de aprobar/despublicar/rechazar).
      set((estado) => ({ negocios: estado.negocios.filter((n) => n.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo archivar el negocio.") });
    }
  },

  restaurarArchivo: async (id, token) => {
    try {
      await apiFetch<Negocio>(`/negocios/${id}/restaurar-archivo`, { metodo: "PATCH", token });
      // Mismo criterio que archivar: sale de la vista donde estaba (archivados).
      set((estado) => ({ negocios: estado.negocios.filter((n) => n.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo restaurar el negocio.") });
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch<void>(`/negocios/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ negocios: estado.negocios.filter((n) => n.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar el negocio.") });
      return false;
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
