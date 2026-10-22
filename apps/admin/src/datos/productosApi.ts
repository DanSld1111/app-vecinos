import { DetalleProducto, Moneda, Producto } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo } from "./clienteApi";

/**
 * Productos de un negocio. Sin store global a propósito: solo los usa la pestaña Productos de
 * la ficha, así que el estado vive en ese componente — un store compartido solo agregaría un
 * lugar más donde desincronizarse.
 */

export interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaMenu: string;
  destacado: boolean;
  /** Campos propios de la categoría del negocio (ej. talla en Moda) — vacío si no aplica. */
  atributos?: Record<string, string>;
  /** null = la moneda del negocio. */
  moneda?: Moneda | null;
  /** Fotos extra, además de la portada (decisión 0096). Sin enviar = no cambian. */
  fotos?: string[];
  /** Ficha Tours: salidas, itinerario, incluye… Sin enviar = no cambia. */
  detalle?: DetalleProducto;
}

/** Sube una foto extra y devuelve su URL; se guarda en el producto al mandar `fotos`. */
export const subirFotoExtra = (negocioId: string, archivo: File, token: string) =>
  apiSubirArchivo<{ url: string }>(`/negocios/${negocioId}/productos/fotos`, archivo, token);

export const listarProductos = (negocioId: string) =>
  apiFetch<Producto[]>(`/negocios/${negocioId}/productos`);

export const listarPapelera = (negocioId: string, token: string) =>
  apiFetch<Producto[]>(`/negocios/${negocioId}/productos/papelera`, { token });

export const crearProducto = (negocioId: string, datos: DatosProducto, token: string) =>
  apiFetch<Producto>(`/negocios/${negocioId}/productos`, { metodo: "POST", token, cuerpo: datos });

export const actualizarProducto = (negocioId: string, productoId: string, datos: DatosProducto, token: string) =>
  apiFetch<Producto>(`/negocios/${negocioId}/productos/${productoId}`, { metodo: "PUT", token, cuerpo: datos });

/** A la papelera — recuperable. */
export const eliminarProducto = (negocioId: string, productoId: string, token: string) =>
  apiFetch<void>(`/negocios/${negocioId}/productos/${productoId}`, { metodo: "DELETE", token });

export const restaurarProducto = (negocioId: string, productoId: string, token: string) =>
  apiFetch<Producto>(`/negocios/${negocioId}/productos/${productoId}/restaurar`, { metodo: "PATCH", token });

/** Borrado real: también borra la foto de Supabase Storage. Sin vuelta atrás. */
export const eliminarDefinitivo = (negocioId: string, productoId: string, token: string) =>
  apiFetch<void>(`/negocios/${negocioId}/productos/${productoId}/definitivo`, { metodo: "DELETE", token });

/** Se manda la lista completa de ids en el orden final, no "subir uno". */
export const reordenarProductos = (negocioId: string, idsEnOrden: string[], token: string) =>
  apiFetch<Producto[]>(`/negocios/${negocioId}/productos/orden`, {
    metodo: "PUT",
    token,
    cuerpo: { idsEnOrden },
  });

export const subirFotoProducto = (negocioId: string, productoId: string, archivo: File, token: string) =>
  apiSubirArchivo<Producto>(`/negocios/${negocioId}/productos/${productoId}/foto`, archivo, token);

export const quitarFotoProducto = (negocioId: string, productoId: string, token: string) =>
  apiFetch<Producto>(`/negocios/${negocioId}/productos/${productoId}/foto`, { metodo: "DELETE", token });
