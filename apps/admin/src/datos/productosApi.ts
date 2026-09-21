import { Producto } from "@app-vecinos/tipos";
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
}

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
